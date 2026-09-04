import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SideBar from "./SideBar";

jest.mock("react-router-dom", () => ({
  NavLink: ({ children, to, className, ...props }) => (
    <a href={to} className={typeof className === "function" ? className({ isActive: false }) : className} {...props}>
      {children}
    </a>
  ),
}), { virtual: true });

describe("sidebar controls", () => {
  test("toggles the sidebar collapsed state", async () => {
    const user = userEvent.setup();
    const setCollapsed = jest.fn();
    render(<SideBar collapsed={false} setCollapsed={setCollapsed} />);

    await user.click(screen.getByRole("button", { name: /toggle sidebar/i }));

    expect(setCollapsed).toHaveBeenCalledWith(true);
  });
});