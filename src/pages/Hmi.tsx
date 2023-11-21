import { useState, useRef } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import { supaClient } from '../hooks/supa-client.ts';

export async function serialConnect() {
  try {
    const { data } = await supaClient.auth.getSession();

    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;

    const requestBody = {
      access_token,
      refresh_token
    };

    const responseMachine = await fetch('http://localhost:3001/setup-local-server', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (responseMachine.ok) {
      console.log('Server setup ready.');
    } else {
      console.error('Failed to setup server.');
      return redirect('/stretch');
    }

    const responseSerialPort = await fetch('http://localhost:3001/initialize-serial-port', {
      method: 'POST',
    });

    if (responseSerialPort.ok) {
      console.log('Serial port initialized successfully.');
      return { loaded: true };
    } else {
      console.error('Failed to initialize the serial port.');
      return redirect('/stretch');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return redirect('/stretch');
  }
}



export default function HMI() {
  const [loading, setLoading] = useState(false);
  const [leftButton, setLeftButton] = useState('eversionL');
  const [rightButton, setRightButton] = useState('eversionR');
  
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const hmiButtonClick = async (buttonClicked: string) => {
    setLoading(true);

    try {
      intervalRef.current = setInterval(async () => {
        const response = await fetch('http://localhost:3001/hmi-button-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ buttonClicked }), 
        });

        if (response.ok) {
          console.log('Eversion movement sent successfully.');
        } else {
          console.error('Failed to send eversion.');
        }
      }, 100); 
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const stopEversionButtonClick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setLoading(false);
  };

  const handleNextClick = () => {
    setRightButton("dorsiflexionU")
    setLeftButton("dorsiflexionD")

  };

  const handleBackClick = async () => {

    if( leftButton === 'dorsiflexionD')
    {
      setRightButton("eversionR")
      setLeftButton("eversionL")

    }
    else
    {
      const response = await fetch('http://localhost:3001/reset-serial-port', {
        method: 'POST',
      });

      if( response.ok){
        navigate('/stretch');
      } else {
        console.log("Failed to reset machineData");
      }
    }
  };

  const test = async () => {

    const { data } = await supaClient.auth.getSession();

    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;
    
    const requestBody = {
      access_token: access_token,
      refresh_token: refresh_token,
    };
    
    const response = await fetch('http://localhost:3001/push-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (response.ok) {
      console.log("Data pushed to supabase");
    } else {
      console.error('Failed to close serial port.');
    }

    const response2 = await fetch('http://localhost:3001/reset-serial-port', {
      method: 'POST',
    });

    if( response2.ok){
      navigate('/stretch');
      console.log("Serial port deconnected and machineDaa reset");
    } else {
      console.log("Failed to reset machineData");
    }

  }
  

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] justify-end">
      <div className="mb-10">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 mr-10 rounded"
          onMouseDown={() => hmiButtonClick(leftButton)}
          onMouseUp={stopEversionButtonClick}
          onMouseLeave={stopEversionButtonClick}
          disabled={loading}
        >
          {leftButton === 'eversionL' ? 'EversionL' : 'DorsiflexionD'}
        </button>
        <button 
        onClick={() => test()}
        >
          Test
        </button>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onMouseDown={() => hmiButtonClick(rightButton)}
          onMouseUp={stopEversionButtonClick}
          onMouseLeave={stopEversionButtonClick}
          disabled={loading}
        >
          {rightButton === 'eversionR' ? 'EversionR' : 'DorsiflexionU'}
        </button>
        {leftButton === 'dorsiflexionD' && (
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 mr-10 rounded"
            onMouseDown={() => hmiButtonClick(leftButton)}
            onMouseUp={stopEversionButtonClick}
            onMouseLeave={stopEversionButtonClick}
            disabled={loading}
          >
            ExtensionD
          </button>
        )}
  
        {rightButton === 'dorsiflexionU' && (
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            onMouseDown={() => hmiButtonClick(leftButton)}
            onMouseUp={stopEversionButtonClick}
            onMouseLeave={stopEversionButtonClick}
            disabled={loading}
          >
            ExtensionU
          </button>
        )}
      </div>
      <div className="flex justify-between p-5">
        <button className="text-left" onClick={handleBackClick}>
          Back
        </button>
        <button className="text-right" onClick={handleNextClick}>
          Next
        </button>
      </div>
    </div>
  );
  
}
