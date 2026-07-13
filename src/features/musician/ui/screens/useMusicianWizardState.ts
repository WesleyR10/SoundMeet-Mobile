import { useReducer } from 'react';
import type { PixKeyType, Step1FieldErrors } from '../../domain/musician.validation';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  step:        WizardStep;
  stageName:   string;
  bio:         string;
  instruments: string[]; // ids do musician.constants.ts
  genres:      string[]; // ids do musician.constants.ts
  qrCode:      string | null;
  fieldErrors: Step1FieldErrors;
  step2Error:  string | null;
  avatarUri:   string | null;
  avatarError: string | null;
  pixKeyType:  PixKeyType | null;
  pixKey:      string;
  pixError:    string | null;
}

type Action =
  | { type: 'SET_STAGE_NAME'; value: string }
  | { type: 'SET_BIO'; value: string }
  | { type: 'TOGGLE_INSTRUMENT'; id: string }
  | { type: 'TOGGLE_GENRE'; id: string }
  | { type: 'SET_FIELD_ERRORS'; errors: Step1FieldErrors }
  | { type: 'SET_STEP2_ERROR'; message: string | null }
  | { type: 'ADVANCE_TO_STEP2' }
  | { type: 'ADVANCE_TO_STEP3'; qrCode: string | null }
  | { type: 'ADVANCE_TO_STEP4' }
  | { type: 'ADVANCE_TO_STEP5' }
  | { type: 'GO_BACK_TO_STEP1' }
  | { type: 'SET_AVATAR_URI'; uri: string | null }
  | { type: 'SET_AVATAR_ERROR'; message: string | null }
  | { type: 'SET_PIX_TYPE'; pixKeyType: PixKeyType }
  | { type: 'SET_PIX_KEY'; value: string }
  | { type: 'SET_PIX_ERROR'; message: string | null };

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STAGE_NAME':      return { ...state, stageName: action.value, fieldErrors: {} };
    case 'SET_BIO':              return { ...state, bio: action.value };
    case 'TOGGLE_INSTRUMENT':    return { ...state, instruments: toggle(state.instruments, action.id) };
    case 'TOGGLE_GENRE':          return { ...state, genres: toggle(state.genres, action.id) };
    case 'SET_FIELD_ERRORS':      return { ...state, fieldErrors: action.errors };
    case 'SET_STEP2_ERROR':       return { ...state, step2Error: action.message };
    case 'ADVANCE_TO_STEP2':      return { ...state, step: 2, fieldErrors: {} };
    case 'ADVANCE_TO_STEP3':      return { ...state, step: 3, qrCode: action.qrCode, step2Error: null };
    case 'ADVANCE_TO_STEP4':      return { ...state, step: 4, avatarError: null };
    case 'ADVANCE_TO_STEP5':      return { ...state, step: 5, pixError: null };
    case 'GO_BACK_TO_STEP1':      return { ...state, step: 1 };
    case 'SET_AVATAR_URI':        return { ...state, avatarUri: action.uri };
    case 'SET_AVATAR_ERROR':      return { ...state, avatarError: action.message };
    case 'SET_PIX_TYPE':          return { ...state, pixKeyType: action.pixKeyType, pixError: null };
    case 'SET_PIX_KEY':           return { ...state, pixKey: action.value };
    case 'SET_PIX_ERROR':         return { ...state, pixError: action.message };
    default:                      return state;
  }
}

const initialState = (initialStep: WizardStep): WizardState => ({
  step:        initialStep,
  stageName:   '',
  bio:         '',
  instruments: [],
  genres:      [],
  qrCode:      null,
  fieldErrors: {},
  step2Error:  null,
  avatarUri:   null,
  avatarError: null,
  pixKeyType:  null,
  pixKey:      '',
  pixError:    null,
});

export function useMusicianWizardState(initialStep: WizardStep = 1) {
  const [state, dispatch] = useReducer(reducer, initialStep, initialState);

  return {
    state,
    setStageName:     (value: string) => dispatch({ type: 'SET_STAGE_NAME', value }),
    setBio:            (value: string) => dispatch({ type: 'SET_BIO', value }),
    toggleInstrument: (id: string) => dispatch({ type: 'TOGGLE_INSTRUMENT', id }),
    toggleGenre:       (id: string) => dispatch({ type: 'TOGGLE_GENRE', id }),
    setFieldErrors:    (errors: Step1FieldErrors) => dispatch({ type: 'SET_FIELD_ERRORS', errors }),
    setStep2Error:     (message: string | null) => dispatch({ type: 'SET_STEP2_ERROR', message }),
    advanceToStep2:    () => dispatch({ type: 'ADVANCE_TO_STEP2' }),
    advanceToStep3:    (qrCode: string | null) => dispatch({ type: 'ADVANCE_TO_STEP3', qrCode }),
    advanceToStep4:    () => dispatch({ type: 'ADVANCE_TO_STEP4' }),
    advanceToStep5:    () => dispatch({ type: 'ADVANCE_TO_STEP5' }),
    goBackToStep1:     () => dispatch({ type: 'GO_BACK_TO_STEP1' }),
    setAvatarUri:      (uri: string | null) => dispatch({ type: 'SET_AVATAR_URI', uri }),
    setAvatarError:    (message: string | null) => dispatch({ type: 'SET_AVATAR_ERROR', message }),
    setPixKeyType:     (pixKeyType: PixKeyType) => dispatch({ type: 'SET_PIX_TYPE', pixKeyType }),
    setPixKey:         (value: string) => dispatch({ type: 'SET_PIX_KEY', value }),
    setPixError:       (message: string | null) => dispatch({ type: 'SET_PIX_ERROR', message }),
  };
}
