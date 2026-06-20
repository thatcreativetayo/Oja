import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingStep from '../../../components/OnboardingStep';
import ContinueButton from '../../../components/ContinueButton';
import { buyerData } from '../../../stores/OnboardingStore';

export default function BuyerStep2() {
  const router = useRouter();
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressDesc, setAddressDesc] = useState('');

  const canContinue = area.trim().length > 0 && landmark.trim().length > 0;

  const handleContinue = () => {
    buyerData.area = area.trim();
    buyerData.landmark = landmark.trim();
    buyerData.addressDesc = addressDesc.trim();
    router.push('/onboarding/buyer/success' as any);
  };

  return (
    <OnboardingStep
      title="Delivery Address"
      subtitle="Where should we deliver your orders?"
      step={2}
      totalSteps={2}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View
          className="flex-row items-center p-3.5 rounded-xl mb-6"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <Text style={{ fontSize: 16 }} className="mr-2">📍</Text>
          <Text className="text-sm leading-5 text-accent" style={{ flex: 1 }}>
            We use landmark-based addressing since street numbers aren't always reliable in Redemption City.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Area / Neighborhood</Text>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Phase 3, Redemption City"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Nearest landmark</Text>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Opposite the secondary school"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Extra directions{' '}
            <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>
          <TextInput
            value={addressDesc}
            onChangeText={setAddressDesc}
            placeholder="Any extra info to help the rider find you"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
            style={{ height: 90 }}
          />
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} label="Start Shopping" />
    </OnboardingStep>
  );
}