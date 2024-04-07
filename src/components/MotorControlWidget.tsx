import React from "react";
import Button from "./Button.tsx";
interface MotorControlWidgetProps {
  title: string;
  icon: any;
  labels: string[];
  mode: string;
  action: string;
  color: string;
  disabled?: boolean;
}

const MotorControlWidget: React.FC<MotorControlWidgetProps> = (props) => {
  return (
    <div className="w-2/6 h-full rounded-[20px] bg-white mr-8 flex flex-col justify-between">
      <div className="w-full h-fit bg-blue-600 rounded-[20px] justify-center content-center flex flex-col">
        <p className="justify-center flex text-xl">{props.title}</p>
        <div className="justify-center flex">{props.icon}</div>
      </div>
      <div className="flex flex-col justify-evenly h-full">
        <div className="flex justify-evenly">
          {props.labels[0] !== undefined ? (
            <Button
              label={props.labels[0]}
              mode={props.mode}
              content={props.labels[0]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
          {props.labels[1] !== undefined ? (
            <Button
              label={props.labels[1]}
              mode={props.mode}
              content={props.labels[1]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
        </div>
        <div className="flex justify-evenly">
          {props.labels[2] !== undefined ? (
            <Button
              label={props.labels[2]}
              mode={props.mode}
              content={props.labels[2]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
          {props.labels[3] !== undefined ? (
            <Button
              label={props.labels[3]}
              mode={props.mode}
              content={props.labels[3]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
        </div>
        <div className="flex justify-evenly">
          {props.labels[4] !== undefined ? (
            <Button
              label={props.labels[4]}
              mode={props.mode}
              content={props.labels[4]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
          {props.labels[5] !== undefined ? (
            <Button
              label={props.labels[5]}
              mode={props.mode}
              content={props.labels[5]}
              action={props.action}
              color="bg-blue-600"
              disabled={props.disabled}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MotorControlWidget;
