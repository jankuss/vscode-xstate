import * as React from "react";
import * as ReactDOM from "react-dom";
import { StateChart } from "@statecharts/xstate-viz";
import { any } from "prop-types";
import * as XState from "xstate";

function toMachine(
  machine: XState.StateNode<any> | string
): XState.StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  let createMachine: Function;

  try {
    createMachine = new Function(
      "Machine",
      "interpret",
      "assign",
      "XState",
      machine
    );
  } catch (e) {
    throw e;
  }

  let resultMachine: XState.StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    resultMachine = XState.Machine(config, options, ctx);

    console.log(resultMachine);

    return resultMachine;
  };

  createMachine(machineProxy, XState.interpret, XState.assign, XState);

  return resultMachine! as XState.StateNode<any>;
}

declare const acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

export function App() {
  const [machine, _setMachine] = React.useState<XState.StateNode | null>(null);
  const stateMachineRef = React.useRef<StateChart>(null);

  function setMachine(machine: XState.StateNode) {
    vscode.postMessage({ type: "MACHINE_ID", payload: machine.id });

    _setMachine(machine);
    if (stateMachineRef.current) {
      stateMachineRef.current.reset(undefined, machine);
    }
  }

  function receiveMessage(event: MessageEvent) {
    console.log(event);

    if (event.data.type === "EDITOR_TEXT") {
      const machine = toMachine(event.data.payload);
      setMachine(machine);
    }
  }

  React.useEffect(() => {
    window.addEventListener("message", receiveMessage);
    vscode.postMessage({ type: "SUBSCRIBED" });

    return function cleanup() {
      console.log("CLEANUP");
      window.removeEventListener("message", receiveMessage);
    };
  }, []);

  console.log("Render");
  if (!machine)
    return (
      <div>
        <h1>Loading..</h1>
      </div>
    );

  return <StateChart machine={machine} ref={stateMachineRef} />;
}

ReactDOM.render(<App />, document.getElementById("root"));
