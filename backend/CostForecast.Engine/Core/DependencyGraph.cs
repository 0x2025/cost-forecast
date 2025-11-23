using System;
using System.Collections.Generic;
using System.Linq;

namespace CostForecast.Engine.Core;

public class DependencyGraph
{
    private readonly Dictionary<string, GraphNode> _nodes = new();

    public void AddNode(GraphNode node)
    {
        if (_nodes.ContainsKey(node.Name))
        {
            throw new ArgumentException($"Node with name {node.Name} already exists.");
        }
        _nodes[node.Name] = node;
    }

    public GraphNode GetNode(string name)
    {
        return _nodes.TryGetValue(name, out var node) ? node : null;
    }

    /// <summary>
    /// Performs a Topological Sort using Kahn's Algorithm to determine the execution order of the graph.
    /// </summary>
    /// <returns>A list of nodes in the order they should be executed.</returns>
    /// <exception cref="InvalidOperationException">Thrown if a cycle is detected in the graph.</exception>
    public List<GraphNode> GetExecutionOrder()
    {
        // Kahn's Algorithm for Topological Sorting
        // ----------------------------------------
        // 1. Compute In-Degree:
        //    Calculate the number of incoming edges (dependencies) for each node.
        //    In our graph, if A depends on B (A -> B), it means B must be evaluated before A.
        //    So, B is a dependency of A.
        //    However, for topological sort, we view the edge as Dependency -> Dependent (B -> A).
        //    So we count how many dependencies a node has (which is what node.Dependencies.Count gives us directly if we view it that way,
        //    but strictly speaking, In-Degree in a Dependency Graph (A depends on B) usually means edges pointing TO A.
        //    Here:
        //    - Node A has Dependencies { B }.
        //    - Execution Order: B, then A.
        //    - Graph Edge for Sort: B -> A.
        //    - In-Degree of A: 1 (from B).
        //    - In-Degree of B: 0.

        var sortedList = new List<GraphNode>();
        var inDegree = new Dictionary<GraphNode, int>();

        // Initialize in-degree for all nodes to 0
        foreach (var node in _nodes.Values)
        {
            inDegree[node] = 0;
        }

        // Build Adjacency List (Dependency -> List of Dependents) and Compute In-Degree
        // We need to know: "Who depends on Node X?" to decrement their in-degree when X is processed.
        var dependents = new Dictionary<GraphNode, List<GraphNode>>();
        foreach (var node in _nodes.Values)
        {
            dependents[node] = new List<GraphNode>();
        }

        foreach (var node in _nodes.Values) // 'node' is the Dependent (e.g., A)
        {
            foreach (var dependency in node.Dependencies) // 'dependency' is the Dependency (e.g., B)
            {
                // Edge: Dependency -> Dependent (B -> A)
                if (!dependents.ContainsKey(dependency)) dependents[dependency] = new List<GraphNode>();
                dependents[dependency].Add(node);
                
                // Increment in-degree of the dependent node (A has 1 more dependency)
                inDegree[node]++;
            }
        }

        // 2. Initialize Queue:
        //    Add all nodes with in-degree 0 to a queue. These are nodes with no dependencies (or all dependencies resolved).
        var queue = new Queue<GraphNode>(inDegree.Where(x => x.Value == 0).Select(x => x.Key));

        // 3. Process Queue:
        while (queue.Count > 0)
        {
            var node = queue.Dequeue();
            sortedList.Add(node); // Add to sorted order

            // For each node that depends on the current node...
            if (dependents.TryGetValue(node, out var nodeDependents))
            {
                foreach (var dependent in nodeDependents)
                {
                    // ...decrement its in-degree (simulate removing the edge from the graph)
                    inDegree[dependent]--;

                    // If in-degree becomes 0, all its dependencies are resolved, so add to queue.
                    if (inDegree[dependent] == 0)
                    {
                        queue.Enqueue(dependent);
                    }
                }
            }
        }

        // 4. Check for Cycles:
        //    If the sorted list count doesn't match the total node count, the graph has a cycle.
        if (sortedList.Count != _nodes.Count)
        {
            throw new InvalidOperationException("Graph contains a cycle. Topological sort cannot be completed.");
        }

        return sortedList;
    }
}
