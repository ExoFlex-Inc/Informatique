import { useNavigate } from "react-router-dom";
import Dialog from "../components/Dialog.tsx";
import { useState } from "react";

const TermsAndConditions = () => {
    const navigate = useNavigate();
    const [boxChecked, setBoxChecked] = useState(false);

    return (
        <Dialog
            allowClose={false}
            open={true}
            contents={
              <form
                onSubmit={() => navigate('/welcome')}
              >
                <div className="overflow-auto flex flex-col max-h-96 ">
                  <h1 className="text-2xl">Terms and Conditions</h1>
                  <section>
                    <h2 className="text-lg">1. Introduction</h2>
                    <p>Welcome to Exoflex. By accessing or using our application, you agree to be bound by these terms and conditions.
                        If you do not agree, please do not use our application.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">2. User Responsibilities</h2>
                    <p>You agree to provide accurate and complete information when using our application.
                        You must comply with all applicable laws and regulations.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">3. Data Collection and Usage</h2>
                    <p>We collect data including but not limited to your performance data and personal information to track
                        your progress and improve our services. Your data is securely stored using Supabase.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">4. Data Privacy and Security</h2>
                    <p>Please refer to our ... for details on how we protect your data.
                        We implement various security measures to safeguard your information.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">5. Usage of the Application</h2>
                    <p>You may use the application as intended for tracking your performance.
                        Any misuse, such as attempting to reverse engineer the application, is prohibited.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">6. Intellectual Property</h2>
                    <p>The application and its contents are owned by Exoflex.
                        You are granted a non-transferable, non-exclusive license to use the application.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">7. Liability and Disclaimer</h2>
                    <p>The application is provided "as is" without warranties of any kind. Exoflex is not liable for any damages arising from your use of the application.</p>
                  </section>
                  <section>
                    <h2 className="text-lg">8. Changes to the T&C</h2>
                    <p>We reserve the right to modify these terms and conditions at any time.
                        You will be notified of any changes via email or in-app notification.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-lg">9. Contact Information</h2>
                    <p>If you have any questions or need support, please contact us at support@exoflex.com.</p>
                  </section>

                  <hr />
                  <div className="flex gap-4">
                    <input type="checkbox" onChange={() => setBoxChecked(!boxChecked)} />
                    <p>I agree with the terms and conditions</p>
                  </div>
                  <button
                    className="welcome-form-submit-button"
                    type="submit"
                    disabled={!boxChecked}
                  >
                    Submit
                  </button>
                </div>
              </form>
              }
        />
    )
}

export default TermsAndConditions;