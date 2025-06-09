from typing import TypedDict, Optional, List, Union
from pydantic import BaseModel, Field

class CalendarEventSchema(BaseModel):
    """Custom schema compatible with Azure OpenAI structured output."""
    summary: Optional[str] = Field(default=None, description="The title of the event.")
    start_datetime: Optional[str] = Field(default=None, description="The start datetime for the event in 'YYYY-MM-DD HH:MM:SS' format.")
    end_datetime: Optional[str] = Field(default=None, description="The end datetime for the event in 'YYYY-MM-DD HH:MM:SS' format.")
    location: Optional[str] = Field(default=None, description="The location of the event.")
    description: Optional[str] = Field(default=None, description="The description of the event.")
    attendees: Optional[List[str]] = Field(default=None, description="A list of attendees' email addresses for the event.")
    is_create_meeting: Optional[bool] = Field(
        default=None,
        description="Whether to create a meeting link for the event."
    )
    reminder_prior_minutes: Optional[int] = Field(
        default=None,
        description="Number of minutes before the event to send a reminder for the event if provided."
    )