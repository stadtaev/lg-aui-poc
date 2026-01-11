import json
import logging
from typing import AsyncGenerator

from asgi_correlation_id import correlation_id
from assistant_stream import RunController, create_run
from assistant_stream.assistant_stream_chunk import AssistantStreamChunk
from assistant_stream.serialization.assistant_transport import (
    AssistantTransportResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from dh_llm_engine.api_config_loader import config_manager
from dh_llm_engine.api_engine_manager import inferenceEngineManager
from dh_llm_engine.configs.engine_config import dhAIEngineConfig
from dh_llm_engine.engines.chat_runtime import dhAIChatRuntime
from dh_llm_engine.formatting.input_formatting import format_input_data
from dh_llm_engine.middleware import dhUserContext, require_bearer_auth
from dh_llm_engine.models.chat import (
    ChatResponse,
    ConversationHistoryResponse,
    ConversationListResponse,
    configNamePath,
    dhAIEngineChatRequest,
    dhAIEngineChatRequestByConfig,
)

logger = logging.getLogger(__name__)

# After removing the chat_stream endpoints, we can use this way to define things easier
# router = APIRouter(prefix="/chat", tags=["Chat"])
router = APIRouter(tags=["Chat"])


@router.post("/chat/stream")
async def stream_lang_graph_chat_default(
    request: dhAIEngineChatRequestByConfig,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """
    Stream chat with default or body-specified config using AssistantTransportResponse.

    Priority:
    1. Uses DEFAULT_CONFIG_NAME if request.config_name is None
    2. Uses request.config_name if provided in body

    Returns structured streaming response with RunController support.
    """

    try:
        engine, config = await _get_engine_and_config(request.config_name)

        stream = await _full_stream_chat(
            engine=engine,
            config=config,
            user=user,
            request=request,
            transientHeaders=dict(raw_request.headers),
        )

        return AssistantTransportResponse(stream)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.post("/chat/stream/{config_name}")
async def stream_lang_graph_chat_with_config(
    config_name: configNamePath,
    request: dhAIEngineChatRequest,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """
    Stream chat with path-specified config using AssistantTransportResponse.

    Priority:
    1. Path parameter ALWAYS takes precedence
    2. Body config_name is ignored if path parameter is present

    Returns structured streaming response with RunController support.
    """

    try:
        engine, config = await _get_engine_and_config(config_name)

        stream = await _full_stream_chat(
            engine=engine,
            config=config,
            user=user,
            request=request,
            transientHeaders=dict(raw_request.headers),
        )

        return AssistantTransportResponse(stream)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat_with_config(
    request: dhAIEngineChatRequestByConfig,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """Send a chat message using a specified config from the manager."""
    try:

        engine, config = await _get_engine_and_config(request.config_name)

        return await _process_chat(
            engine=engine,
            config=config,
            user=user,
            request=request,
            transientHeaders=raw_request.headers,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.post("/chat/{config_name}", response_model=ChatResponse)
async def chat_with_config_name(
    config_name: configNamePath,
    request: dhAIEngineChatRequest,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """Send a chat message using a config specified in the URL path."""
    try:
        engine, config = await _get_engine_and_config(config_name)

        return await _process_chat(
            engine=engine,
            config=config,
            user=user,
            request=request,
            transientHeaders=raw_request.headers,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.post("/chat_stream")
async def stream_chat_with_config(
    request: dhAIEngineChatRequestByConfig,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """Stream a chat message using a specified config from the manager."""
    try:
        engine, config = await _get_engine_and_config(request.config_name)

        return StreamingResponse(
            _stream_chat(
                engine=engine,
                config=config,
                user=user,
                request=request,
                transientHeaders=raw_request.headers,
            ),
            media_type="text/plain",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.post("/chat_stream/{config_name}")
async def stream_chat_with_config_name(
    config_name: configNamePath,
    request: dhAIEngineChatRequest,
    raw_request: Request,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """Stream a chat message using a config specified in the URL path."""
    try:
        engine, config = await _get_engine_and_config(config_name)

        return StreamingResponse(
            _stream_chat(
                engine=engine,
                config=config,
                user=user,
                request=request,
                transientHeaders=raw_request.headers,
            ),
            media_type="text/plain",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.get(
    "/chat/{config_name}/conversations", response_model=ConversationListResponse
)
async def list_conversations(
    config_name: configNamePath, user: dhUserContext = Depends(require_bearer_auth)
):
    """
    List all active conversations for a given chatbot config.
    """
    try:
        engine, _ = await _get_engine_and_config(config_name)

        context_config = {}
        context_config["token_user_upn"] = user.user_upn

        conversations = await engine.list_conversations(context_config)

        return ConversationListResponse(
            conversations=conversations,
            count=len(conversations),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.get(
    "/chat/{config_name}/conversations/{conversation_id}",
    response_model=ConversationHistoryResponse,
)
async def get_conversation(
    config_name: configNamePath,
    conversation_id: str,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """
    Get the conversation history for a specific conversation ID.
    """
    try:
        engine, _ = await _get_engine_and_config(config_name)

        history = await engine.get_conversation(
            conversation_id=conversation_id,
            context_config={"token_user_upn": user.user_upn},
        )

        if history is None:
            raise HTTPException(
                status_code=404, detail=f"Conversation '{conversation_id}' not found."
            )

        # Convert messages to dict format
        formatted_messages = []
        for msg in history:
            if isinstance(msg, HumanMessage):
                formatted_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                formatted_messages.append({"role": "assistant", "content": msg.content})

        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=formatted_messages,
            count=len(formatted_messages),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


@router.delete("/chat/{config_name}/conversations/{conversation_id}")
async def delete_conversation(
    config_name: configNamePath,
    conversation_id: str,
    user: dhUserContext = Depends(require_bearer_auth),
):
    """
    Delete a specific conversation and its history.
    """
    try:
        engine, _ = await _get_engine_and_config(config_name)

        history = await engine.get_conversation(
            conversation_id=conversation_id,
            context_config={"token_user_upn": user.user_upn},
        )

        if history is None:
            raise HTTPException(
                status_code=404, detail=f"Conversation '{conversation_id}' not found."
            )

        await engine.delete_conversation(conversation_id)

        return {"message": f"Conversation '{conversation_id}' deleted successfully."}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value error: {str(e)}")


async def _get_engine_and_config(
    config_name: str,
) -> tuple[dhAIChatRuntime, dhAIEngineConfig]:
    config = config_manager.get_engine_config_by_name(config_name)
    if not config:
        msg = f"Config '{config_name}' not found."
        logger.error(msg)
        raise ValueError(msg)

    if config.spec.type.lower() != "chatbot":
        msg = f"Config '{config_name}' is not a chatbot engine."
        logger.error(msg)
        raise ValueError(msg)

    engine = await inferenceEngineManager.get_engine(config.metadata.name, config.spec)
    if not isinstance(engine, dhAIChatRuntime):
        msg = f"Engine for config '{config_name}' is not a dhAIChatRuntime."
        logger.error(msg)
        raise ValueError(msg)

    return engine, config


async def _process_chat(
    engine: dhAIChatRuntime,
    config: dhAIEngineConfig,
    user: dhUserContext,
    request: dhAIEngineChatRequest | dhAIEngineChatRequestByConfig,
    transientHeaders: dict[str, str] | None = None,
) -> ChatResponse:
    """
    Process a chat request using the specified engine configuration.
    """

    # Copy context_config to avoid mutation
    context_config = dict(request.context_config)

    context_config["token_user_upn"] = user.user_upn

    if config.spec.structured_inputs:
        input_context_config = format_input_data(
            config.spec.structured_inputs, request=request
        )
        # Merge input_context_config into context_config
        context_config = context_config | input_context_config

    metadata = {"correlation_id": correlation_id.get()}

    result = await engine.chat(
        user_message=request.message,
        conversation_id=request.conversation_id,
        context_config=context_config,
        metadata=request.metadata | metadata,
        mcp_tool_headers=transientHeaders,
    )

    return ChatResponse(
        response=result.response,
        conversation_id=result.conversation_id,
        usage_metadata=result.usage_metadata,
        assistant_responses=result.assistant_responses,
    )


async def _stream_chat(
    engine: dhAIChatRuntime,
    config: dhAIEngineConfig,
    user: dhUserContext,
    request: dhAIEngineChatRequest | dhAIEngineChatRequestByConfig,
    transientHeaders: dict[str, str] | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat request using the specified engine configuration.
    """
    # Copy context_config to avoid mutation
    context_config = dict(request.context_config)

    context_config["token_user_upn"] = user.user_upn

    if config.spec.structured_inputs:
        input_context_config = format_input_data(
            config.spec.structured_inputs, request=request
        )
        # Merge input_context_config into context_config
        context_config = context_config | input_context_config

    metadata = {"correlation_id": correlation_id.get()}

    async for chunk in engine.stream_chat(
        user_message=request.message,
        conversation_id=request.conversation_id,
        context_config=context_config,
        metadata=request.metadata | metadata,
        mcp_tool_headers=transientHeaders,
    ):
        # Yield each chunk as JSON
        yield json.dumps(chunk) + "\n"


async def _full_stream_chat(
    engine: dhAIChatRuntime,
    config: dhAIEngineConfig,
    user: dhUserContext,
    request: dhAIEngineChatRequest | dhAIEngineChatRequestByConfig,
    transientHeaders: dict[str, str] | None = None,
) -> AsyncGenerator[AssistantStreamChunk, None]:
    """
    Stream chat with structured AssistantStreamChunk responses using RunController.

    This is the recommended streaming approach that provides:
    - Structured chunk format
    - Better error handling
    - RunController lifecycle management
    - Full control over streaming state
    """
    # Copy context_config to avoid mutation
    context_config = dict(request.context_config)

    context_config["token_user_upn"] = user.user_upn

    # Process structured inputs if configured
    if config.spec.structured_inputs:
        input_context_config = format_input_data(
            config.spec.structured_inputs, request=request
        )
        # Merge input_context_config into context_config
        context_config = context_config | input_context_config

    # Add correlation ID for tracing
    metadata = {"correlation_id": correlation_id.get()}

    async def callback_stream(controller: RunController):
        """
        Callback function for RunController-based streaming.
        This allows the engine to control the streaming lifecycle with LangGraph events.
        """
        await engine.stream_full_chat(
            user_message=request.message,
            conversation_id=request.conversation_id,
            context_config=context_config,
            metadata=request.metadata | metadata,
            mcp_tool_headers=transientHeaders,
            controller=controller,
        )

    return create_run(callback_stream)

