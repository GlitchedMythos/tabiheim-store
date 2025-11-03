import { NavLink, Stack } from '@mantine/core';
import { useLocation, Link, useNavigate } from 'react-router';
import { IconDashboard, IconLogout } from '@tabler/icons-react';
import { signOut } from '~/lib/auth';

interface NavbarProps {
  onClose: () => void;
}

export function Navbar({ onClose }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      label: 'Dashboard',
      icon: IconDashboard,
      path: '/dashboard',
    },
  ];

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      onClose();
      navigate('/');
    }
  };

  return (
    <Stack justify="space-between" h="100%">
      <Stack gap="xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={<Icon size={20} stroke={1.5} />}
              active={isActive}
              onClick={onClose}
            />
          );
        })}
      </Stack>

      <NavLink
        label="Logout"
        leftSection={<IconLogout size={20} stroke={1.5} />}
        onClick={handleLogout}
        color="red"
      />
    </Stack>
  );
}

