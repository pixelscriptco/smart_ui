// components/NameInputModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';

interface NameInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, floorCount: number) => void;
}

const NameInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name,0);
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter name for this area"
      onSubmit={handleSubmit}
      submitText="Save"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Area name"
        className="modal-input"
      />
    </Modal>
  );
};

export default NameInputModal;
