import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";

import Button from "../components/Button..tsx";
import useStm32 from "../hooks/use-stm32.ts";

export default function Manual() {
  const { stm32Data, errorFromStm32 } = useStm32();

  return (
    <div className="flex flex-col custom-height justify-center">
      <div className="mt-20 mb-20 flex justify-center">
        <Button
          label="Motor1H"
          mode="Manual"
          action="Increment"
          content="motor1H"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Motor1AH"
          mode="Manual"
          action="Increment"
          content="motor1AH"
          className="mr-8"
          disabled={errorFromStm32}
        />
        <Button
          label="Motor2H"
          mode="Manual"
          action="Increment"
          content="motor2H"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Motor2AH"
          mode="Manual"
          action="Increment"
          content="motor2AH"
          className="mr-8"
          disabled={errorFromStm32}
        />
        <Button
          label="Motor3H"
          mode="Manual"
          action="Increment"
          content="motor3H"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Motor3AH"
          mode="Manual"
          action="Increment"
          content="motor3AH"
          className="mr-8"
          disabled={errorFromStm32}
        />
      </div>

      <div className="mb-20 flex justify-center">
        <Button
          label="EversionL"
          mode="Manual"
          action="Increment"
          content="eversionL"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="EversionR"
          mode="Manual"
          action="Increment"
          content="eversionR"
          className="mr-8"
          disabled={errorFromStm32}
        />
        <Button
          label="DorsiflexionU"
          mode="Manual"
          action="Increment"
          content="dorsiflexionU"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="DorsiflexionD"
          mode="Manual"
          action="Increment"
          content="dorsiflexionD"
          className="mr-8"
          disabled={errorFromStm32}
        />
        <Button
          label="ExtensionU"
          mode="Manual"
          action="Increment"
          content="extensionU"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="ExtensionD"
          mode="Manual"
          action="Increment"
          content="extensionD"
          className="mr-8"
          disabled={errorFromStm32}
        />
      </div>

      <div className="flex justify-center">
        <Button
          label="Home1"
          mode="Manual"
          action="Homing"
          content="1"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Home2"
          mode="Manual"
          action="Homing"
          content="2"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Home3"
          mode="Manual"
          action="Homing"
          content="3"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="Home"
          mode="Manual"
          action="Homing"
          content="all"
          className="mr-4"
          disabled={errorFromStm32}
        />
        <Button
          label="setHome"
          mode="Manual"
          action="Homing"
          content="setHome"
          className="mr-4"
          disabled={errorFromStm32}
        />
      </div>
    </div>
  );
}
