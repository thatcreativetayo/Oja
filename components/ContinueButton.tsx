import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface Props {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}

export default function ContinueButton({ onPress, label = 'Continue', disabled = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="mt-auto mb-16 py-3.5 rounded-full items-center"
      style={{ backgroundColor: disabled ? '#E5E7EB' : '#EB0031' }}
      activeOpacity={0.85}
    >
      <Text
        className="text-base font-sans font-semibold"
        style={{ color: disabled ? '#9CA3AF' : '#fff', fontWeight: 700 }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}