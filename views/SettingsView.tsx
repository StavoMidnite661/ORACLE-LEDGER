
import React, { useState } from 'react';

interface SettingsViewProps {
  contractAddress: string;
  setContractAddress: (address: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ contractAddress, setContractAddress }) => {
  const [localAddress, setLocalAddress] = useState(contractAddress);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setContractAddress(localAddress);
    setSaveMessage('Contract address updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Smart Contract Configuration</h3>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div>
            <label htmlFor="contractAddress" className="block text-sm font-medium text-sov-light-alt">
              SOVRCreditBridgeVault Address
            </label>
            <input
              type="text"
              id="contractAddress"
              value={localAddress}
              onChange={(e) => setLocalAddress(e.target.value)}
              required
              className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light font-mono focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
            >
              Save Address
            </button>
            {saveMessage && (
                <span className="text-sov-green font-semibold">{saveMessage}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
