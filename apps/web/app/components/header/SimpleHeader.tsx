import { Container, Group } from '@mantine/core';
import { ThemeToggle } from '../theme-toggle';
import styles from './SimpleHeader.module.css';

export function SimpleHeader() {
  return (
    <header className={styles.header}>
      <Container size="md" className={styles.inner}>
        <Group w="100%" justify="flex-end">
          {/* <!-- Add icon for color scheme toggle --> */}
          <ThemeToggle />
        </Group>
      </Container>
    </header>
  );
}
