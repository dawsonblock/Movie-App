import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SafeThirdPartyFrame } from "./SafeThirdPartyFrame";

describe("SafeThirdPartyFrame", () => {
  it("renders fallback for disallowed URLs", () => {
    render(<SafeThirdPartyFrame src="https://evil.com/video" title="evil" />);
    expect(screen.getByText(/not allowed/i)).toBeInTheDocument();
  });

  it("renders an iframe for allowed URLs", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const iframe = screen.getByTitle("vidlink");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-presentation",
    );
  });

  it("shows a click-intercept overlay on first load", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    expect(screen.getByText(/click to start watching/i)).toBeInTheDocument();
    expect(screen.getByText(/popup attempts are blocked/i)).toBeInTheDocument();
  });

  it("dismisses the overlay on click", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const overlay = screen.getByRole("button", {
      name: /dismiss overlay/i,
    });
    fireEvent.click(overlay);
    expect(
      screen.queryByText(/click to start watching/i),
    ).not.toBeInTheDocument();
  });

  it("dismisses the overlay on Enter key", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const overlay = screen.getByRole("button", {
      name: /dismiss overlay/i,
    });
    fireEvent.keyDown(overlay, { key: "Enter" });
    expect(
      screen.queryByText(/click to start watching/i),
    ).not.toBeInTheDocument();
  });

  it("dismisses the overlay on Space key", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const overlay = screen.getByRole("button", {
      name: /dismiss overlay/i,
    });
    fireEvent.keyDown(overlay, { key: " " });
    expect(
      screen.queryByText(/click to start watching/i),
    ).not.toBeInTheDocument();
  });

  it("shows a persistent shield button after the overlay is dismissed", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const overlay = screen.getByRole("button", {
      name: /dismiss overlay/i,
    });
    fireEvent.click(overlay);
    const shield = screen.getByRole("button", {
      name: /re-enable player protection overlay/i,
    });
    expect(shield).toBeInTheDocument();
  });

  it("re-shows the overlay when the shield button is clicked", () => {
    render(
      <SafeThirdPartyFrame
        src="https://vidlink.pro/movie/123"
        title="vidlink"
      />,
    );
    const overlay = screen.getByRole("button", {
      name: /dismiss overlay/i,
    });
    fireEvent.click(overlay);
    const shield = screen.getByRole("button", {
      name: /re-enable player protection overlay/i,
    });
    fireEvent.click(shield);
    expect(screen.getByText(/click to start watching/i)).toBeInTheDocument();
  });
});
