import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  // Inject global styles to hide scrollbars
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      *::-webkit-scrollbar {
        display: none;
      }
      body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
      html {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <View style={styles.notch} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '90vh',
  },
  frame: {
    width: 390,
    height: 720,
    backgroundColor: '#fff',
    borderRadius: 40,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '12px solid #2c2c2e',
    position: 'relative',
    paddingTop: 15
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: [{ translateX: -70 }],
    width: 140,
    height: 30,
    backgroundColor: '#2c2c2e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
