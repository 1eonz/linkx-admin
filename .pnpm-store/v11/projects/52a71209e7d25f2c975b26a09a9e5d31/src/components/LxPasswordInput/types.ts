export interface LxPasswordInputProps {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showPassword?: boolean;
  maxlength?: number | string;
  minlength?: number | string;
  size?: '' | 'small' | 'default' | 'large';
  autocomplete?: string;
  readonly?: boolean;
  name?: string;
}
