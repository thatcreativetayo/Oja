import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/AuthStore';
import { useNavigation } from '@react-navigation/native';

export function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'buyer' | 'vendor' | 'rider'>('buyer');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const { sendOtp, verifyOtp, isLoading, error, clearError } = useAuthStore();
  const navigation = useNavigation();

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      clearError();
      await sendOtp(phone);
      setStep('otp');
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the verification code');
      return;
    }

    try {
      clearError();
      await verifyOtp(phone, otp, role);
      
      // Navigate based on role
      if (role === 'buyer') {
        (navigation as any).replace('BuyerHome');
      } else if (role === 'vendor') {
        (navigation as any).replace('VendorDashboard');
      } else if (role === 'rider') {
        (navigation as any).replace('RiderJobs');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    }
  };

  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>Sent to {phone}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('phone')}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Change Phone Number</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back to Oja</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <Text style={styles.label}>Select Role</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
          onPress={() => setRole('buyer')}
        >
          <Text style={[styles.roleButtonText, role === 'buyer' && styles.roleButtonTextActive]}>
            Buyer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'vendor' && styles.roleButtonActive]}
          onPress={() => setRole('vendor')}
        >
          <Text style={[styles.roleButtonText, role === 'vendor' && styles.roleButtonTextActive]}>
            Vendor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'rider' && styles.roleButtonActive]}
          onPress={() => setRole('rider')}
        >
          <Text style={[styles.roleButtonText, role === 'rider' && styles.roleButtonTextActive]}>
            Rider
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+234 812 345 6789"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => (navigation as any).navigate('Onboarding')}
      >
        <Text style={styles.signupButtonText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF5F0',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#FF6B00',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#666',
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 8,
  },
});
