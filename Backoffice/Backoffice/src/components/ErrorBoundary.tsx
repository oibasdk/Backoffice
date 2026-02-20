import React from "react";
import { FullPageError } from "./StateViews";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ui_error_boundary", error);
  }

  render() {
    if (this.state.hasError) {
      return <FullPageError />;
    }
    return this.props.children;
  }
}
