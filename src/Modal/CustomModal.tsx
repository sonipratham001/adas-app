import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
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
  overlayStyle?: object;
  containerStyle?: object;
  titleStyle?: object;
  messageStyle?: object;
  confirmButtonStyle?: object;
  cancelButtonStyle?: object;
  confirmTextStyle?: object;
  cancelTextStyle?: object;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isVisible,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
  overlayStyle,
  containerStyle,
  titleStyle,
  messageStyle,
  confirmButtonStyle,
  cancelButtonStyle,
  confirmTextStyle,
  cancelTextStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0.8);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 10,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.in(Easing.ease),
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

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(iconScaleAnim, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      backdropOpacity={0.6}
      animationInTiming={300}
      animationOutTiming={200}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={200}
      style={[styles.modal, overlayStyle]}
    >
      <Animated.View
        style={[
          styles.modalContent,
          containerStyle,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: iconScaleAnim }],
          }}
        >
          <Icon
            type="font-awesome"
            size={48}
            {...getIconProps()}
            style={styles.icon}
          />
        </Animated.View>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Text style={[styles.message, messageStyle]}>{message}</Text>
        <View style={styles.buttonRow}>
          {type === 'confirmation' ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, cancelButtonStyle]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText, cancelTextStyle]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, confirmButtonStyle]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, confirmTextStyle]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.closeButton, confirmButtonStyle]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, confirmTextStyle]}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  closeButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#1F2937',
  },
});

export default CustomModal;