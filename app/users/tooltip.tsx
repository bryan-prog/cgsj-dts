import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface TooltipProps {
  message: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

const Tooltip: React.FC<TooltipProps> = ({ message, children, containerStyle }) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={() => setVisible(!visible)}
      activeOpacity={1}
    >
      {children}
      {visible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{message}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 5,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    zIndex: 999,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default Tooltip;
