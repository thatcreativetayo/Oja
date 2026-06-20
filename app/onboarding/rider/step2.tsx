import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingStep from '../../../components/OnboardingStep';
import ContinueButton from '../../../components/ContinueButton';
import { riderData } from '../../../stores/OnboardingStore';

const vehicles = [
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', desc: 'Fast deliveries, most common' },
  { id: 'bicycle', label: 'Bicycle', icon: '🚲', desc: 'Short-distance deliveries' },
  { id: 'keke', label: 'Keke (Tricycle)', icon: '🛺', desc: 'Larger or bulkier orders' },
];

export default function RiderStep2() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleDesc, setVehicleDesc] = useState('');

  const canContinue = vehicleType.length > 0;

  const handleContinue = () => {
    riderData.vehicleType = vehicleType;
    riderData.vehicleDesc = vehicleDesc.trim();
    router.push('/onboarding/rider/step3' as any);
  };

  return (
    <OnboardingStep
      title="Your Vehicle"
      subtitle="What do you use for deliveries?"
      step={2}
      totalSteps={3}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-3 mb-6">
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setVehicleType(v.id)}
              activeOpacity={0.7}
              className="flex-row items-center p-4 rounded-2xl border"
              style={{
                backgroundColor: vehicleType === v.id ? '#FEF2F2' : '#F9FAFB',
                borderColor: vehicleType === v.id ? '#EB0031' : '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 28 }} className="mr-4">{v.icon}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{v.label}</Text>
                <Text className="text-sm text-gray-500 mt-0.5">{v.desc}</Text>
              </View>
              {vehicleType === v.id && (
                <View
                  className="w-6 h-6 rounded-full items-center bg-accent justify-center"
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Vehicle description{' '}
            <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>
          <TextInput
            value={vehicleDesc}
            onChangeText={setVehicleDesc}
            placeholder="e.g. Red Honda CG 125"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} />
    </OnboardingStep>
  );
}