import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./pages/HomePage";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });

describe("application navigation", () => {
  beforeEach(() => mockNavigate.mockClear());

  test("home page opens the protein viewer from its primary action", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /open 3d protein viewer/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/protein-viewer");
  });

  test("home page navigates to the resources page", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /browse resources/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/resources");
  });
});