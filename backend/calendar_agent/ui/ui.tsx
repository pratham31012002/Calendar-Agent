import "./styles.css";
import { useState } from "react";
import {
  Clock,
  MapPin,
  FileText,
  Users,
  Video,
  Bell,
  ChevronDown,
  Edit,
  Check,
  Plus,
  X,
  CalendarDays,
  ExternalLink,
  Calendar
} from "lucide-react";
import { UIMessage, useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";

interface Event {
  id: string;
  htmlLink: string;
  summary: string;
  start: string;
  end: string;
}

interface ViewEventsProps {
  events: Event[];
}

interface CalendarEventProps {
  summary?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  is_create_meeting?: boolean;
  reminder_prior_minutes?: number;
}

interface CalendarEventData {
  summary: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  description?: string;
  attendees?: string[];
  is_create_meeting?: boolean;
  reminder_prior_minutes?: number;
}

interface EditableFieldState {
  [key: string]: boolean;
}

const ViewEventsComponent = (props: ViewEventsProps) => {
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDisplayTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateRange = (start: string, end: string): string => {
    if (!start || !end) return "";

    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDateStr = formatDisplayDate(start);
    const endDateStr = formatDisplayDate(end);
    const startTimeStr = formatDisplayTime(start);
    const endTimeStr = formatDisplayTime(end);

    // Same day
    if (startDateStr === endDateStr) {
      return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
    }

    // Different days
    return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
  };

  const openEventLink = (htmlLink: string) => {
    window.open(htmlLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="events-view-container">
      <div className="events-view-header">
        <h2 className="events-view-title">
          <Calendar size={20} />
          Your Events
        </h2>
        <p className="events-view-description">
          {props.events.length === 0
            ? "No events found"
            : `Found ${props.events.length} event${props.events.length === 1 ? '' : 's'}`
          }
        </p>
      </div>

      {props.events.length === 0 ? (
        <div className="events-empty-state">
          <CalendarDays size={48} className="empty-state-icon" />
          <p className="empty-state-text">No events to display</p>
        </div>
      ) : (
        <div className="events-list">
          {props.events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <h3 className="event-title">{event.summary}</h3>
                <button
                  className="btn btn-ghost event-link-btn"
                  onClick={() => openEventLink(event.htmlLink)}
                  title="Open in Google Calendar"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
              <div className="event-details">
                <div className="event-time">
                  <Clock size={14} />
                  <span>{formatDateRange(event.start, event.end)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateEventComponent = (props: CalendarEventProps) => {
  const formatDateToYYYYMMDDHHMMSS = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const convertToDatetimeLocal = (dateString: string): string => {
    if (!dateString) return "";
    // Convert from 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM' for datetime-local input
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<CalendarEventData>({
    summary: props.summary || "",
    start_datetime: props.start_datetime ? formatDateToYYYYMMDDHHMMSS(props.start_datetime) : "",
    end_datetime: props.end_datetime ? formatDateToYYYYMMDDHHMMSS(props.end_datetime) : "",
    location: props.location || "",
    description: props.description || "",
    attendees: props.attendees || [],
    is_create_meeting: props.is_create_meeting || false,
    reminder_prior_minutes: props.reminder_prior_minutes || undefined,
  });

  const [editableFields, setEditableFields] = useState<EditableFieldState>({});
  const [attendeeInput, setAttendeeInput] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { ui: UIMessage | undefined } }
  >();

  const toggleEdit = (fieldName: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleInputChange = (field: keyof CalendarEventData, value: any) => {
    // Convert datetime-local values to YYYY-MM-DD HH:MM:SS format
    let processedValue = value;
    if ((field === 'start_datetime' || field === 'end_datetime') && value) {
      processedValue = formatDateToYYYYMMDDHHMMSS(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const addAttendee = () => {
    if (attendeeInput.trim() && !formData.attendees?.includes(attendeeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), attendeeInput.trim()]
      }));
      setAttendeeInput("");
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees?.filter(a => a !== email) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataStr = JSON.stringify(formData, null, 2);
    thread.submit(
      {},
      {
        command: {
          update: {
            confirmed_create_event: formDataStr,
            messages: [
              {
                role: "user",
                content: "Creation Request Confirmed",
              },
            ],
          },
          goto: "chat_node",
        },
      },
    );
  };

  const renderField = (
    fieldName: keyof CalendarEventData,
    label: string,
    icon: React.ReactNode,
    type: string = "text",
    required: boolean = false,
    placeholder?: string
  ) => {
    // Check if prop has a meaningful value (not undefined, null, empty string, or empty array)
    const propValue = props[fieldName];
    const hasInitialValue = propValue !== undefined &&
      propValue !== null &&
      propValue !== "" &&
      !(Array.isArray(propValue) && propValue.length === 0);
    const isEditing = editableFields[fieldName] || !hasInitialValue;

    return (
      <div className="form-field">
        <label className="form-label">
          {icon}
          {label} {required && <span className="required">*</span>}
        </label>
        {hasInitialValue && !isEditing ? (
          <div className="readonly-field">
            <span className="readonly-value">
              {type === "datetime-local"
                ? formatDateToYYYYMMDDHHMMSS(formData[fieldName] as string)
                : String(formData[fieldName] || "")}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => toggleEdit(fieldName)}
              aria-label={`Edit ${label}`}
            >
              <Edit size={14} />
            </button>
          </div>
        ) : (
          <div className="input-wrapper">
            {type === "textarea" ? (
              <textarea
                className="form-textarea"
                value={String(formData[fieldName] || "")}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                placeholder={placeholder}
                required={required}
                rows={3}
              />
            ) : type === "checkbox" ? (
              <input
                type="checkbox"
                className="form-checkbox"
                checked={Boolean(formData[fieldName])}
                onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              />
            ) : (
              <input
                type={type}
                className="form-input"
                value={String(formData[fieldName] || "")}
                onChange={(e) => handleInputChange(fieldName, type === "number" ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                required={required}
              />
            )}
            {hasInitialValue && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => toggleEdit(fieldName)}
              >
                <Check size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="event-form-container">
      <div className="event-form-header">
        <h2 className="event-form-title">
          <CalendarDays size={20} />
          Create Event
        </h2>
        <p className="event-form-description">Confirm the details for your calendar event</p>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        {/* Required fields */}
        {renderField("summary", "Event Title", <FileText size={16} />, "text", true, "Enter event title")}

        <div className="form-row">
          {renderField("start_datetime", "Start Date & Time", <Clock size={16} />, "datetime-local", true)}
          {renderField("end_datetime", "End Date & Time", <Clock size={16} />, "datetime-local", true)}
        </div>

        {/* Toggle for optional fields */}
        <button
          type="button"
          className="expand-toggle"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
        >
          <span>Advanced Settings</span>
          <ChevronDown
            size={16}
            className={`chevron-icon ${showOptionalFields ? 'expanded' : ''}`}
          />
        </button>

        {/* Optional fields */}
        <div className={`optional-fields ${showOptionalFields ? 'show' : ''}`}>
          {renderField("location", "Location", <MapPin size={16} />, "text", false, "Enter event location")}

          {renderField("description", "Description", <FileText size={16} />, "textarea", false, "Enter event description")}

          {/* Create Meeting Link - custom inline checkbox */}
          <div className="form-field">
            <label className="form-label checkbox-inline">
              <span className="checkbox-label-content">
                <Video size={16} />
                Create Meeting Link
              </span>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={Boolean(formData.is_create_meeting)}
                onChange={(e) => handleInputChange("is_create_meeting", e.target.checked)}
              />
            </label>
          </div>

          {renderField("reminder_prior_minutes", "Reminder (minutes before)", <Bell size={16} />, "number", false, "e.g., 15, 30, 60")}

          {/* Attendees field - special handling */}
          <div className="form-field">
            <label className="form-label">
              <Users size={16} />
              Attendees
            </label>
            {(() => {
              const attendeesValue = props.attendees;
              const hasAttendeesValue = attendeesValue !== undefined &&
                attendeesValue !== null &&
                Array.isArray(attendeesValue) &&
                attendeesValue.length > 0;

              if (hasAttendeesValue && !editableFields.attendees) {
                return (
                  <div className="readonly-field">
                    <div className="attendees-list">
                      {formData.attendees?.map((email, index) => (
                        <span key={index} className="attendee-tag">{email}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => toggleEdit("attendees")}
                      aria-label="Edit Attendees"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                );
              } else {
                return (
                  <div className="attendees-input-section">
                    <div className="attendee-input-wrapper">
                      <input
                        type="email"
                        className="form-input"
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        placeholder="Enter attendee email"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={addAttendee}
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                    <div className="attendees-list">
                      {formData.attendees?.map((email, index) => (
                        <div key={index} className="attendee-tag">
                          {email}
                          <button
                            type="button"
                            className="remove-attendee"
                            onClick={() => removeAttendee(email)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {hasAttendeesValue && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => toggleEdit("attendees")}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            <CalendarDays size={16} />
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default {
  createEvent: CreateEventComponent,
  viewEvents: ViewEventsComponent,
};