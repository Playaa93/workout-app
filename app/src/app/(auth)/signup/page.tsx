'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signup } from '@/lib/auth-actions';
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

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const d = useDark();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signup(formData);
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
              Crée ton compte
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                name="displayName"
                label="Pseudo"
                required
                fullWidth
                autoComplete="name"
                autoFocus
                sx={goldFieldSx(d)}
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                sx={goldFieldSx(d)}
              />
              <TextField
                name="password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="new-password"
                helperText="6 caractères minimum"
                sx={{
                  ...goldFieldSx(d),
                  '& .MuiFormHelperText-root': { color: tc.f(d) },
                }}
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
              <TextField
                name="confirmPassword"
                label="Confirmer le mot de passe"
                type={showConfirm ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="new-password"
                sx={goldFieldSx(d)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(!showConfirm)}
                          edge="end"
                          size="small"
                          sx={{ color: tc.f(d) }}
                        >
                          {showConfirm
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
                  : 'Créer mon compte'}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ color: tc.m(d) }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: GOLD, fontWeight: 600 }}>
              Se connecter
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
