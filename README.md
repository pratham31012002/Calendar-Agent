# Calendar Agent

**Your Personal AI Assistant for Calendar Management**

## 📋 Overview

Calendar Agent is an intelligent personal assistant built with LangGraph and Next.js that helps you manage your Google Calendar through natural language interactions. The agent can create, view, update, and delete calendar events while providing a seamless conversational experience.

## ✨ Features

- **🗣️ Natural Language Interface**: Interact with your calendar using conversational commands
- **📅 Full Calendar Management**: Create, view, update, and delete calendar events
- **🔍 Smart Event Search**: Find events by date range, keywords, or specific criteria
- **⏰ Intelligent Scheduling**: Automatically find suitable time slots for new events
- **🎯 Generative UI**: Generative UI streaming for event creation and viewing, to provide a more interactive and dynamic user experience

## 🏗️ Architecture

The project consists of two main components:

### Backend (LangGraph Agent)
- **Agent Framework**: Built with LangGraph for intelligent conversation flow
- **AI Model**: Powered by Azure OpenAI GPT-4o
- **Calendar Integration**: Google Calendar API through LangChain toolkit
- **State Management**: Persistent conversation state and event handling

### Frontend (Next.js Application)
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Modern React components with Tailwind CSS
- **Interactive Forms**: Dynamic event creation and editing interfaces
- **Responsive Design**: Mobile-friendly interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.12+
- Google Calendar API credentials
- Azure OpenAI API access
- LangGraph CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Calendar-Agent
   ```

2. **Set up Google Calendar API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Calendar API
   - Create credentials (OAuth 2.0 client ID)
   - Download credentials as `credentials.json` and place in `backend/calendar_agent/agent/`
   - Refer to the instructions [here](https://developers.google.com/workspace/calendar/api/quickstart/python) for more details

3. **Configure environment variables**
   
   Create `.env` file in the `backend` directory:
   ```env
   AZURE_OPENAI_API_KEY=your_azure_openai_key
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_API_VERSION=your_api_version
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the LangGraph server**
   ```bash
   cd backend
   langgraph dev --allow-blocking
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: `http://localhost:3000`
   - LangGraph Server: `http://127.0.0.1:2024`
   - LangGraph Studio: `https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024`

## 🛠️ Usage

Once the app is running, you'll be prompted to enter:

- **Deployment URL**: The URL of the LangGraph server you want to chat with. This is `http://127.0.0.1:2024` if you're running the server locally.
- **Assistant/Graph ID**: The name of the graph, or ID of the assistant to use when fetching, and submitting runs via the chat interface. This is `calendar_agent` for this project.
- **LangSmith API Key**: (only required for connecting to deployed LangGraph servers) Your LangSmith API key to use when authenticating requests sent to LangGraph servers.

After entering these values, click `Continue`. You'll then be redirected to a chat interface where you can start chatting with your LangGraph server.

### Basic Commands

- **Create Events**: "Schedule a meeting tomorrow at 2 PM"
- **View Events**: "What's on my calendar this week?"
- **Update Events**: "Move my dentist appointment to 3 PM"
- **Delete Events**: "Cancel my lunch meeting on Friday"
- **Find Available Times**: "When am I free tomorrow afternoon?"

### Advanced Features

- **Event Details**: Specify location, description, attendees, and reminders
- **Meeting Links**: Automatically generate video conference links
- **Smart Scheduling**: Find optimal meeting times based on availability, Eg. "Find a free time for a 1-hour Dentist Appointment between 10 AM and 5 PM tomorrow"
- **Multiple Creations/Updates/Deletes in same query**: "Schedule a Dentist Appointment for tomorrow at 2 PM, and a Lunch Meeting with John Doe at 1 PM", "Clear my calendar for next week"
- **Planning and Event Creation**: "Plan a 3 day trip to Singapore from 12th July"

## 📚 API Reference

### Calendar Tools

#### `create_event`
Creates a new calendar event with optional details.

**Parameters:**
- `summary`: Event title
- `start_datetime`: Start time (YYYY-MM-DD HH:MM:SS)
- `end_datetime`: End time (YYYY-MM-DD HH:MM:SS)
- `location`: Event location
- `description`: Event description
- `attendees`: List of attendee emails
- `is_create_meeting`: Generate meeting link
- `reminder_prior_minutes`: Reminder time in minutes

#### `view_events`
Search and display calendar events.

**Parameters:**
- `min_datetime`: Search start time
- `max_datetime`: Search end time
- `query`: Search keywords

#### `update_event_tool`
Update existing calendar events by event ID.

#### `delete_event_tool`
Delete calendar events by event ID.

#### `current_datetime_tool`
Get current date and time for relative time references.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | Yes |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | Yes |
| `AZURE_OPENAI_API_VERSION` | API version | Yes |

### Google Calendar Setup

1. Place `credentials.json` in `backend/calendar_agent/agent/`
2. First run will generate `token.json` after OAuth flow
3. Grant necessary calendar permissions

---

**Ready to get started?** Follow the installation guide above and begin managing your calendar with AI! 🚀
