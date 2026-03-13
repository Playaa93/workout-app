'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { login } from '@/lib/auth-actions';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { GOLD, GOLD_CONTRAST, W, tc, glass, meshBg, goldFieldSx, goldBtnSx } from '@/lib/design-tokens';
import { useDark } from '@/hooks/useDark';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const d = useDark();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        window.location.href = '/';
      }
    });
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: meshBg(d),
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400, ...glass(d, { p: 4 }) }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: GOLD,
                textShadow: `0 0 20px ${alpha(GOLD, 0.3)}`,
              }}
            >
              Workout
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: tc.m(d) }}>
              Connecte-toi pour continuer
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                name="email"
                label="Email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                autoFocus
                sx={goldFieldSx(d)}
              />
              <TextField
                name="password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="current-password"
                sx={goldFieldSx(d)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: tc.f(d) }}
                        >
                          {showPassword
                            ? <EyeSlash size={20} weight={W} />
                            : <Eye size={20} weight={W} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isPending}
                sx={{
                  ...goldBtnSx,
                  '&:hover': { bgcolor: alpha(GOLD, 0.85) },
                  '&.Mui-disabled': { bgcolor: alpha(GOLD, 0.4), color: GOLD_CONTRAST },
                }}
              >
                {isPending
                  ? <CircularProgress size={24} sx={{ color: GOLD_CONTRAST }} />
                  : 'Se connecter'}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ color: tc.m(d) }}>
            Pas encore de compte ?{' '}
            <Link href="/signup" style={{ color: GOLD, fontWeight: 600 }}>
              Créer un compte
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
