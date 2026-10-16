import { describe, it, expect, vi } from "vitest";

describe("ExecutionsList auto-select behavior", () => {
  // Simulate the selection effect
  const runSelectionEffect = (executions, selectedExecutionId, onExecutionChange) => {
    const firstExecutionId = executions[0]?.id;
    if (firstExecutionId && !selectedExecutionId) {
      onExecutionChange(firstExecutionId);
    }
  };

  it("auto-selects first execution on initial load when nothing is selected", () => {
    const onExecutionChange = vi.fn();
    const executions = [{ id: "exec-1" }, { id: "exec-2" }];

    runSelectionEffect(executions, null, onExecutionChange);
    expect(onExecutionChange).toHaveBeenCalledWith("exec-1");
  });

  it("does not change selection when a new execution arrives if an item is already selected", () => {
    const onExecutionChange = vi.fn();
    // User already selected exec-2
    const selectedExecutionId = "exec-2";
    // New execution exec-3 arrives at the top
    const updatedExecutions = [{ id: "exec-3" }, { id: "exec-1" }, { id: "exec-2" }];

    runSelectionEffect(updatedExecutions, selectedExecutionId, onExecutionChange);
    expect(onExecutionChange).not.toHaveBeenCalled();
  });

  it("does nothing when executions list is empty", () => {
    const onExecutionChange = vi.fn();
    runSelectionEffect([], null, onExecutionChange);
    expect(onExecutionChange).not.toHaveBeenCalled();
  });
});
