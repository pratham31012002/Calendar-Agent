import uuid
from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import AzureChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.ui import push_ui_message
from calendar_agent.agent.prompts import CHAT_NODE_SYSTEM_INSTRUCTION
from calendar_agent.agent.schemas import CalendarEventSchema
from calendar_agent.agent.state import AgentState
from calendar_agent.agent.tools import calendar_agent_tools, create_confirmed_event
from langgraph.prebuilt import ToolNode, tools_condition
from datetime import datetime
from pytz import timezone

async def chat_node(state: AgentState):    
    if state.get("confirmed_create_event", None) is not None:
        event_params_str = state["confirmed_create_event"]
        event_params_parsed = CalendarEventSchema.model_validate_json(event_params_str)
        create_event_output = await create_confirmed_event(event_params_parsed)
        message = AIMessage(
            id=str(uuid.uuid4()),
            content=f"{str(create_event_output)}",
        )
        return {"messages": [message], "confirmed_create_event": None}
    
    # today_date_time_asia_kolkata
    today_date_time_asia_kolkata = datetime.now(timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")
        
    system_message = SystemMessage(
        content=CHAT_NODE_SYSTEM_INSTRUCTION.format(
            today_date_time_asia_kolkata=today_date_time_asia_kolkata
        )
    )
    
    chat_node_output = (
        await AzureChatOpenAI(model="gpt-4o")
        .bind_tools(calendar_agent_tools)
        .ainvoke([system_message, *state["messages"]])
    )

    return {"messages": [chat_node_output], "confirmed_create_event": None}

tool_node = ToolNode(tools=calendar_agent_tools)

workflow = StateGraph(AgentState)
workflow.add_node(chat_node)
workflow.add_node("tools", tool_node)

workflow.add_conditional_edges(
    "chat_node",
    tools_condition,
)
workflow.add_edge("tools", "chat_node")
workflow.add_edge("__start__", "chat_node")

graph = workflow.compile()