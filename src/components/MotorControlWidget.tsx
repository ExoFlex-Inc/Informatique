import React from "react";
import Button from "./Button..tsx";
interface MotorControlWidgetProps {
    title: string,
    icon: any,
    button1?: string,
    button2?: string,
    button3?: string,
    button4?: string,
    button5?: string,
    button6?: string,
}

const MotorControlWidget: React.FC<MotorControlWidgetProps> = (props) => {
    console.log("test", props.button1);
    return (
        <div className="w-72 h-80 rounded-[20px] bg-white mr-8">
            <div className="w-72 h-24 bg-[#0D7DF2] rounded-[20px] justify-center content-center flex flex-col">
                <p className="justify-center flex text-2xl">
                    {props.title}
                </p>
                <div className="justify-center flex">
                    {props.icon}
                </div>
            </div>
            <div className="justify-center flex">
                {props.button1 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button1} toSend={props.button1} />)}
                {props.button2 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button2} toSend={props.button2} />)}
            </div>
            <div className="justify-center flex">
                {props.button3 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button3} toSend={props.button3} />)}
                {props.button4 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button4} toSend={props.button4} />)}
            </div>
            <div className="justify-center flex">
                {props.button5 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button5} toSend={props.button5} />)}
                {props.button6 !== undefined && (<Button className="bg-[#0D7DF2] text-base w-28 h-14 mr-4 mt-4 ml-4" label={props.button6} toSend={props.button6} />)}
            </div>
        </div>
    );
};

export default MotorControlWidget;