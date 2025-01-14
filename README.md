# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Environment Variables

This project uses the following environment variables:

### Frontend

- `VITE_DOMAIN`: The domain for authentication.
- `VITE_CLIENT_ID`: The client ID for authentication.

### Backend

- `LANGSMITH_TRACING`: Enables tracing.
- `LANGSMITH_API_KEY`: API key for Langsmith.
- `GOOGLE_APPLICATION_CREDENTIALS`: Credentials for Google application.
- `LANGCHAIN_CALLBACKS_BACKGROUND`: (Optional) Reduce tracing latency if not in a serverless environment.
