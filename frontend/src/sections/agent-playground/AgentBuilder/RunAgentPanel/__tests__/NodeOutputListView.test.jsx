import { describe, it, expect } from "vitest";

describe("NodeOutputList executed node data mapping", () => {
  const transformExecutedNodes = (nodes) => {
    if (!nodes?.length) return [];

    const result = [];
    for (const node of nodes) {
      const exec = node.nodeExecution || node.node_execution;
      if (!exec) continue;

      const subGraphNodes = (node.subGraph || node.sub_graph)?.nodes;
      let children = [];
      if (subGraphNodes?.length) {
        for (const inner of subGraphNodes) {
          const innerExec = inner.nodeExecution || inner.node_execution;
          if (!innerExec) continue;
          children.push({
            id: `${node.id}__${inner.id}`,
            name:
              innerExec.node_name ||
              inner.data?.label ||
              inner.name ||
              inner.id,
            type: innerExec.node_type || inner.type || inner.data?.type,
            duration:
              innerExec.duration_seconds != null
                ? innerExec.duration_seconds * 1000
                : (inner.duration ?? 0),
            cost: innerExec.cost ?? inner.cost ?? null,
            tokens: innerExec.tokens ?? inner.tokens ?? null,
          });
        }
      }

      result.push({
        id: node.id,
        name: exec.node_name || node.data?.label || node.name || node.id,
        type: exec.node_type || node.type || node.data?.type,
        duration:
          exec.duration_seconds != null
            ? exec.duration_seconds * 1000
            : (node.duration ?? 0),
        cost: exec.cost ?? node.cost ?? null,
        tokens: exec.tokens ?? node.tokens ?? null,
        children: children.length > 0 ? children : undefined,
      });
    }

    return result;
  };

  it("filters out unexecuted nodes", () => {
    const nodes = [
      { id: "node_1", name: "Prompt 1" },
      { id: "node_2", name: "Prompt 2", nodeExecution: { node_name: "Prompt 2", duration_seconds: 1.5 } },
    ];
    const transformed = transformExecutedNodes(nodes);
    expect(transformed).toHaveLength(1);
    expect(transformed[0].id).toBe("node_2");
    expect(transformed[0].duration).toBe(1500);
    expect(transformed[0].cost).toBeNull();
    expect(transformed[0].tokens).toBeNull();
  });

  it("transforms subgraphs into children with compound IDs", () => {
    const nodes = [
      {
        id: "agent_node_1",
        name: "Agent Node",
        node_execution: { node_name: "Agent Node", duration_seconds: 4 },
        sub_graph: {
          nodes: [
            { id: "step_1", name: "Step 1", node_execution: { node_name: "Step 1", duration_seconds: 2 } },
            { id: "step_2", name: "Step 2" }, // unexecuted
          ],
        },
      },
    ];
    const transformed = transformExecutedNodes(nodes);
    expect(transformed).toHaveLength(1);
    expect(transformed[0].children).toHaveLength(1);
    expect(transformed[0].children[0].id).toBe("agent_node_1__step_1");
    expect(transformed[0].children[0].duration).toBe(2000);
  });

  it("returns empty array when execution has no executed nodes", () => {
    expect(transformExecutedNodes([])).toEqual([]);
    expect(transformExecutedNodes(null)).toEqual([]);
    expect(transformExecutedNodes([{ id: "1" }])).toEqual([]);
  });
});
