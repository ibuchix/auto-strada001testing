import { useEffect } from 'react';
import { clearStaleLocalStorage } from './config/storage';
import { StorageDiagnostic } from './components/diagnostics/StorageDiagnostic';

function App() {
  useEffect(() => {
    // Clear any stale local storage references on app initialization
    clearStaleLocalStorage();
  }, []);

  return (
    <>
      {/* Show storage diagnostic tool in development environment */}
      {import.meta.env.DEV && <StorageDiagnostic />}
      
      <div className="App">
        <header className="App-header">
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </>
  );
}

export default App;
