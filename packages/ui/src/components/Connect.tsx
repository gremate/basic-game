import { useState } from 'react';

interface ConnectProps {
    connectToServer: (username: string) => void;
}

export default function Connect({ connectToServer }: ConnectProps) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const hasError = Boolean(error);

    function onConnectButtonClick() {
        if (!username.trim()) {
            setError('Name is required.');

            return;
        }

        setError('');
        connectToServer(username);
    }

    return (
        <div className="flexbox flexbox-direction-column flexbox-justify-content-center height-100">
            <div>
                <label className="large">
                    Name
                    <input
                        value={username}
                        aria-invalid={hasError}
                        aria-errormessage={hasError ? 'error' : undefined}
                        onChange={event => setUsername(event.target.value)}
                    />
                </label>
                {hasError && (
                    <div id="error" className="ml-12 input-error">
                        {error}
                    </div>
                )}
            </div>
            <button className="mt-18" onClick={onConnectButtonClick}>
                Connect
            </button>
        </div>
    );
}
