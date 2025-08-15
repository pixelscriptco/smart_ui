// components/NameInputModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';

interface NameInputModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (name: string, floorCount: number) => void;
}

const NameFloorInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  title,
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
      title={title}
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
