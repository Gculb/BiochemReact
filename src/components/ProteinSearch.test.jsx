import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProteinSearch from "./ProteinSearch.jsx";

describe("ProteinSearch", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("loads a catalog suggestion through the parent callback", async () => {
    const user = userEvent.setup();
    const onLoad = jest.fn();
    render(<ProteinSearch onLoad={onLoad} />);

    await user.click(screen.getByRole("button", { name: /Myoglobin/ }));

    expect(onLoad).toHaveBeenCalledWith("1MBN", 0, null);
  });

  test("reports short search terms without making a request", async () => {
    const user = userEvent.setup();
    const onLoad = jest.fn();
    const fetchSpy = jest.spyOn(global, "fetch");
    render(<ProteinSearch onLoad={onLoad} />);

    await user.type(screen.getByRole("textbox"), "x");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a PDB ID or protein name");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("loads an exact PDB result and passes its atom count", async () => {
    const user = userEvent.setup();
    const onLoad = jest.fn();
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, text: async () => "ATOM one\nATOM two\nHETATM three" });
    render(<ProteinSearch onLoad={onLoad} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "2por");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("2POR", 2, "ATOM one\nATOM two\nHETATM three"));
  });
});
