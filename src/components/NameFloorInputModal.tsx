// components/NameInputModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';

interface NameInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, floorCount: number) => void;
}

const NameFloorInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [floorCount, setFloorCount] = useState(0);
  
  const handleSubmit = () => {
    if (name.trim() && floorCount) {
      onSubmit(name, floorCount);
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

      <input
        type="number"
        value={floorCount}
        onChange={(e) => setFloorCount(parseInt(e.target.value))}
        placeholder="Number of floors"
        className="modal-input"
      />
    </Modal>
  );
};

export default NameFloorInputModal;
