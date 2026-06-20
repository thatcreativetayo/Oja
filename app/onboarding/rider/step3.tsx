import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingStep from '../../../components/OnboardingStep';
import ContinueButton from '../../../components/ContinueButton';
import { riderData } from '../../../stores/OnboardingStore';

export default function RiderStep3() {
  const router = useRouter();
  const [zones, setZones] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const canContinue =
    zones.trim().length > 0 &&
    bankName.trim().length > 0 &&
    accountNumber.trim().length >= 10;

  const handleContinue = () => {
    riderData.zones = zones.trim();
    riderData.bankName = bankName.trim();
    riderData.accountNumber = accountNumber.trim();
    router.push('/onboarding/rider/success' as any);
  };

  return (
    <OnboardingStep
      title="Zone & Payout"
      subtitle="Where you deliver and how you get paid"
      step={3}
      totalSteps={3}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Areas you cover</Text>
          <TextInput
            value={zones}
            onChangeText={setZones}
            placeholder="e.g. Phase 1, Phase 2, Main Gate area"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
            style={{ height: 80 }}
          />
          <Text className="text-xs text-gray-400 mt-1.5">
            List the zones within Redemption City you can reach
          </Text>
        </View>

        <View className="mb-1">
          <Text className="text-sm font-semibold text-gray-700 mb-4">Payout details</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Bank name</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. Access Bank"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Account number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="0123456789"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base bg-gray-50"
            />
          </View>
        </View>
      </ScrollView>

      <ContinueButton
        onPress={handleContinue}
        disabled={!canContinue}
        label="Submit Application"
      />
    </OnboardingStep>
  );
}