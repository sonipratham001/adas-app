import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Modal from 'react-native-modal';
import { Icon } from 'react-native-elements';

type ModalType = 'success' | 'error' | 'confirmation';

interface CustomModalProps {
  isVisible: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isVisible,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
}) => {
  // Animation refs for modal content and icon
  const scaleAnim = useRef(new Animated.Value(0)).current; // For scaling the modal content
  const opacityAnim = useRef(new Animated.Value(0)).current; // For fading the modal content
  const iconScaleAnim = useRef(new Animated.Value(0)).current; // For scaling the icon

  // Animate modal content when it becomes visible
  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0);

      // Animate modal content (scale and fade in)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Animate icon (bounce effect)
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const getIconProps = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#34C759' };
      case 'error':
        return { name: 'exclamation-circle', color: '#EF4444' };
      case 'confirmation':
        return { name: 'question-circle', color: '#FBBF24' };
      default:
        return { name: 'info-circle', color: '#1F2937' };
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInUp" // Smooth slide-in from bottom
      animationOut="slideOutDown" // Smooth slide-out to bottom
      backdropOpacity={0.5}
      animationInTiming={400}
      animationOutTiming={400}
      backdropTransitionInTiming={400}
      backdropTransitionOutTiming={400}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.modalContent}>
          <Animated.View
            style={{
              transform: [{ scale: iconScaleAnim }],
            }}
          >
            <Icon
              type="font-awesome"
              size={40}
              {...getIconProps()}
              style={styles.icon}
            />
          </Animated.View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {type === 'confirmation' ? (
              <>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#D1D5DB',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  closeButton: {
    backgroundColor: '#1F2937',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomModal;