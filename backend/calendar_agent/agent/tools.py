import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from langchain_google_community import CalendarToolkit
from langchain_google_community.calendar.utils import (
    build_resource_service,
    get_google_credentials,
)
from langchain_google_community.calendar.create_event import CalendarCreateEvent, CreateEventSchema
from langchain_google_community.calendar.delete_event import CalendarDeleteEvent, DeleteEventSchema
from langchain_google_community.calendar.search_events import CalendarSearchEvents, SearchEventsSchema
from langchain_google_community.calendar.update_event import CalendarUpdateEvent, UpdateEventSchema
from langchain_google_community.calendar.current_datetime import GetCurrentDatetime, CurrentDatetimeSchema
from langchain_google_community.calendar.get_calendars_info import GetCalendarsInfo
from typing import Optional, List
from langchain_core.tools import tool
from langgraph.graph.ui import push_ui_message
from langgraph.types import interrupt, Command
from langgraph.prebuilt import InjectedState
from typing import Annotated
from calendar_agent.agent.schemas import CalendarEventSchema
from calendar_agent.agent.state import AgentState
from datetime import datetime, timedelta
from pytz import timezone

# Can review scopes here: https://developers.google.com/calendar/api/auth
# For instance, readonly scope is https://www.googleapis.com/auth/calendar.readonly
credentials = get_google_credentials(
    token_file="token.json",
    scopes=["https://www.googleapis.com/auth/calendar"],
    client_secrets_file="calendar_agent/agent/credentials.json",
)
api_resource = build_resource_service(credentials=credentials)
toolkit = CalendarToolkit(api_resource=api_resource)

@tool(parse_docstring=True)
def create_event(
    state: Annotated[AgentState, InjectedState],
    summary: Optional[str] = None,
    start_datetime: Optional[str] = None,
    end_datetime: Optional[str] = None,
    location: Optional[str] = None,
    description: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    is_create_meeting: Optional[bool] = None,
    reminder_prior_minutes: Optional[int] = None
) -> str:
    """
    Create a calendar event with the specified parameters.
    
    Args:
        summary (Optional[str]): The title of the event.
        start_datetime (Optional[str]): The start datetime for the event in 'YYYY-MM-DD HH:MM:SS' format.
        end_datetime (Optional[str]): The end datetime for the event in 'YYYY-MM-DD HH:MM:SS' format.
        location (Optional[str]): The location of the event.
        description (Optional[str]): The description of the event.
        attendees (Optional[List[str]]): A list of attendees' email addresses for the event.
        is_create_meeting (Optional[bool]): Whether to create a meeting link for the event.
        reminder_prior_minutes (Optional[int]): Number of minutes before the event to send a reminder for the event if provided.
    
    Returns:
        dict: The response from the calendar event creation.
    """
    
    props_to_pass_to_ui = {
        "summary": summary,
        "start_datetime": start_datetime,
        "end_datetime": end_datetime,
        "location": location,
        "description": description,
        "attendees": attendees,
        "is_create_meeting": is_create_meeting,
        "reminder_prior_minutes": reminder_prior_minutes
    }
    
    
    push_ui_message("createEvent", props_to_pass_to_ui, message=state["messages"][-1])
        
    return "ACTION REQUIRED: Ask the user to 'Check the details and click on 'Create Event' to confirm the event creation.' Note that the details have already been shown to the user in the UI, so you can just ask them to confirm the event creation. No need to repeat the details again.'"

async def create_confirmed_event(event_params_passed_from_ui: CalendarEventSchema) -> str:
    summary = event_params_passed_from_ui.summary
    start_datetime = event_params_passed_from_ui.start_datetime
    end_datetime = event_params_passed_from_ui.end_datetime
    location = event_params_passed_from_ui.location
    description = event_params_passed_from_ui.description
    attendees = event_params_passed_from_ui.attendees
    is_create_meeting = event_params_passed_from_ui.is_create_meeting
    reminder_prior_minutes = event_params_passed_from_ui.reminder_prior_minutes
    
    # Initialize the calendar tool
    tool = CalendarCreateEvent()
    
    # Build the event parameters
    event_params = {}
    
    if summary is not None:
        event_params["summary"] = summary
    if start_datetime is not None:
        event_params["start_datetime"] = start_datetime
    if end_datetime is not None:
        event_params["end_datetime"] = end_datetime
    if location is not None:
        event_params["location"] = location
    if description is not None:
        event_params["description"] = description
    if attendees is not None:
        event_params["attendees"] = attendees
    if is_create_meeting is not None:
        event_params["conference_data"] = is_create_meeting
    if reminder_prior_minutes is not None:
        event_params["reminders"] = [{"method": "popup", "minutes": reminder_prior_minutes}]
    event_params["timezone"] = "Asia/Kolkata"
    print(event_params)
    try:
      response = (await tool.ainvoke(event_params))
    except Exception as e:
        return f"{str(e)}"

    return response


@tool(parse_docstring=True)
def view_events(state: Annotated[AgentState, InjectedState], min_datetime: Optional[str] = None, max_datetime: Optional[str] = None, query: Optional[str] = None) -> str:
    """
    Search for calendar events within a specified date range and optional query.
    
    Args:
        min_datetime (Optional[str]): The minimum datetime for the search in 'YYYY-MM-DD HH:MM:SS' format.
        max_datetime (Optional[str]): The maximum datetime for the search in 'YYYY-MM-DD HH:MM:SS' format.
        query (Optional[str]): An optional query string to filter events.
    
    Returns:
        str: The response from the calendar event search.
    """
    
    if min_datetime is None:
        # Current datetime in Asia/Kolkata timezone in 'YYYY-MM-DD HH:MM:SS' format
        min_datetime = datetime.now(timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")
    
    if query is not None and max_datetime is None:
        # Defaults to 90 days from the current datetime in Asia/Kolkata timezone in 'YYYY-MM-DD HH:MM:SS' format
        max_datetime = (datetime.now(timezone("Asia/Kolkata")) + timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")

    if query is None and max_datetime is None:
        # Defaults to 14 days from the current datetime in Asia/Kolkata timezone in 'YYYY-MM-DD HH:MM:SS' format
        max_datetime = (datetime.now(timezone("Asia/Kolkata")) + timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S")
    
    
    search_events_tool = CalendarSearchEvents()
    calendars_info_tool = GetCalendarsInfo()
    calendar_info = str(calendars_info_tool.invoke({}))
    search_tool_output = search_events_tool.invoke(
        {
            "calendars_info": calendar_info,
            "min_datetime": min_datetime,
            "max_datetime": max_datetime,
            "query": query,
            "max_results": 30
        }
    )

    search_tool_output_sanitized = list(map(lambda x: {
        "id": x.get("id", ""),
        "htmlLink": x.get("htmlLink", ""),
        "summary": x.get("summary", ""),
        "start": x.get("start", ""),
        "end": x.get("end", "")
      }, search_tool_output if isinstance(search_tool_output, list) else [search_tool_output]
    ))
    push_ui_message("viewEvents", { "events": search_tool_output_sanitized }, message=state["messages"][-1])

    return { "directive": "ACTION REQUIRED: Mention to the user that 'Above are the events found' if the user has asked to view/list their events. However, if this invocation was an intermediate step before updating/deleting an event, then don't mention anything to the user. Note that the details have already been shown to the user in the UI, so no need to repeat the details again.'", "events": search_tool_output }

# create_tool = CalendarCreateEvent()
# response = create_tool.invoke(
#     {
#         "summary": "Calculus exam",
#         "start_datetime": "2025-07-11 11:00:00",
#         "end_datetime": "2025-07-11 13:00:00",
#         "timezone": "America/Mexico_City",
#         "location": "UAM Cuajimalpa",
#         "description": "Event created from the LangChain toolkit",
#         "reminders": [{"method": "popup", "minutes": 60}],
#         "conference_data": True,
#     }
# )
# print(response)

# search_events_tool = CalendarSearchEvents()
update_event_tool = CalendarUpdateEvent()
delete_event_tool = CalendarDeleteEvent()
current_datetime_tool = GetCurrentDatetime()
# calendars_info_tool = GetCalendarsInfo()

# calendar_info = str(calendars_info_tool.invoke({}))
# search_tool = search_events_tool.invoke(
#     {
#         "calendars_info": calendar_info,
#         "min_datetime": "2025-07-11 11:00:00",
#         "max_datetime": "2025-07-20 13:00:00",
#     }
# )
# print(search_tool)

# current_datetime = current_datetime_tool.invoke({})
# print(current_datetime)

calendar_agent_tools = [
    create_event,
    view_events,
    update_event_tool,
    delete_event_tool,
    current_datetime_tool,
]