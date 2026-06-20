import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingStep from '../../../components/OnboardingStep';
import ContinueButton from '../../../components/ContinueButton';
import { vendorData } from '../../../stores/OnboardingStore';

export default function VendorStep3() {
  const router = useRouter();
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressDesc, setAddressDesc] = useState('');

  const canContinue = area.trim().length > 0 && landmark.trim().length > 0;

  const handleContinue = () => {
    vendorData.area = area.trim();
    vendorData.landmark = landmark.trim();
    vendorData.addressDesc = addressDesc.trim();
    router.push('/onboarding/vendor/success' as any);
  };

  return (
    <OnboardingStep
      title="Store Location"
      subtitle="Where can customers find you?"
      step={3}
      totalSteps={3}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-6">
          <Text className="text-sm font-medium font-sans text-gray-700 mb-2">Area / Neighborhood</Text>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Phase 2, Redemption City"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: "#00000005",
              borderRadius: 10,
              padding: 15,
              borderColor: "#00000010",
              marginTop: 10,
            }}
            className="border font-sans border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-sans font-medium text-gray-700 mb-2">Nearest landmark</Text>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Behind the main auditorium"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: "#00000005",
              borderRadius: 10,
              padding: 15,
              borderColor: "#00000010",
              marginTop: 10,
            }}
            className="border font-sans border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
          />
        </View>

        <View className="mb-6">
          <Text className="text- font-sans font-medium text-gray-700 mb-2">
            More directions{' '}
            <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>
          <TextInput
            value={addressDesc}
            onChangeText={setAddressDesc}
            placeholder="Any extra info to help customers locate you"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border font-sans border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
            style={{
              backgroundColor: "#00000005",
              borderRadius: 10,
              paddingHorizontal: 15,
              borderColor: "#00000010",
              marginTop: 10,
               height: 90
            }}
          />
        </View>
      </ScrollView>

      <ContinueButton onPress={handleContinue} disabled={!canContinue} label="Finish Setup" />
    </OnboardingStep>
  );
}