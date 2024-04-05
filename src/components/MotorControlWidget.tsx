import React from "react";
import Button from "./Button..tsx";
import useStm32 from "../hooks/use-stm32.ts";
interface MotorControlWidgetProps {
    title: string,
    icon: any,
    labels: string[],
    mode: string,
    action: string,
    className: string,
}

const MotorControlWidget: React.FC<MotorControlWidgetProps> = (props) => {
    const {errorFromStm32} = useStm32();
    console.log(props.labels[5]);
    return (
        <div className="w-72 h-80 rounded-[20px] bg-white mr-8">
            <div className="w-72 h-24 bg-blue-600 rounded-[20px] justify-center content-center flex flex-col">
                <p className="justify-center flex text-2xl">
                    {props.title}
                </p>
                <div className="justify-center flex">
                    {props.icon}
                </div>
            </div>
            <div className="justify-center flex">
                {props.labels[0] !== undefined ? <Button label={props.labels[0]} mode={props.mode} content={props.labels[0]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 } 
                {props.labels[1] !== undefined ?<Button label={props.labels[1]} mode={props.mode} content={props.labels[1]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 }
            </div>
            <div className="justify-center flex">
                {props.labels[2] !== undefined ?<Button label={props.labels[2]} mode={props.mode} content={props.labels[2]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 }
                {props.labels[3] !== undefined ?<Button label={props.labels[3]} mode={props.mode} content={props.labels[3]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 }
            </div>
            <div className="justify-center flex">
                {props.labels[4] !== undefined ?<Button label={props.labels[4]} mode={props.mode} content={props.labels[4]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 }
                {props.labels[5] !== undefined ? <Button label={props.labels[5]} mode={props.mode} content={props.labels[5]} action={props.action} className={props.className} disabled={errorFromStm32} /> : 0 } 
            </div>
        </div>
    );
};

export default MotorControlWidget;