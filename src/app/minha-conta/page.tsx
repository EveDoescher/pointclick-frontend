"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent,
} from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { userService } from "@/services/userService";
import { addressService } from "@/services/addressService";
import { buildPublicFileUrl } from "@/services/api";
import {
  formatCep,
  formatCpf,
  formatPhone,
  getInitials,
  normalizeNullableText,
  onlyDigits,
} from "@/utils/formatters";

type ProfileForm = {
  fullName: string;
  cpf: string;
  phone: string;
};

type AddressForm = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
};

type AvatarPosition = {
  x: number;
  y: number;
};

type AvatarImageMeta = {
  naturalWidth: number;
  naturalHeight: number;
};

type AvatarDragState = {
  active: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
};

const AVATAR_CROP_SIZE = 256;
const AVATAR_OUTPUT_SIZE = 512;

export default function MyAccountPage() {
  return (
    <ProtectedRoute>
      <MyAccountContent />
    </ProtectedRoute>
  );
}

function MyAccountContent() {
  const { profile, refreshProfile } = useAuth();
  const { showError, showSuccess } = useFeedbackModal();

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: "",
    cpf: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState<AddressForm>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<AvatarPosition>({
    x: 0,
    y: 0,
  });
  const [avatarImageMeta, setAvatarImageMeta] =
    useState<AvatarImageMeta | null>(null);
  const [avatarDrag, setAvatarDrag] = useState<AvatarDragState>({
    active: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!profile) return;

    setProfileForm({
      fullName: profile.fullName ?? "",
      cpf: formatCpf(profile.cpf),
      phone: formatPhone(profile.phone),
    });

    setAddressForm({
      cep: formatCep(profile.address?.cep),
      street: profile.address?.street ?? "",
      number: profile.address?.number ?? "",
      complement: profile.address?.complement ?? "",
      city: profile.address?.city ?? "",
      state: profile.address?.state ?? "",
    });
  }, [profile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileLoading(true);

    try {
      await userService.updateMyProfile({
        fullName: profileForm.fullName,
        cpf: normalizeNullableText(onlyDigits(profileForm.cpf)),
        phone: normalizeNullableText(onlyDigits(profileForm.phone)),
      });

      await refreshProfile();

      showSuccess("Perfil atualizado com sucesso.");
    } catch (error) {
      showError(error, "Erro ao atualizar perfil");
    } finally {
      setProfileLoading(false);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      showError(
        new Error("Envie uma imagem JPG, PNG, WEBP ou GIF."),
        "Imagem inválida",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError(
        new Error("A imagem deve ter no máximo 5MB."),
        "Imagem inválida",
      );
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setAvatarPosition({ x: 0, y: 0 });
    setAvatarImageMeta(null);
    setAvatarCropOpen(true);
  }

  function closeAvatarCropModal(force = false) {
    if (avatarLoading && !force) return;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarCropOpen(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarPosition({ x: 0, y: 0 });
    setAvatarImageMeta(null);
    setAvatarDrag({
      active: false,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });
  }

  function getAvatarScaledSize() {
    if (!avatarImageMeta) {
      return {
        width: AVATAR_CROP_SIZE,
        height: AVATAR_CROP_SIZE,
        scale: 1,
      };
    }

    const scale = Math.max(
      AVATAR_CROP_SIZE / avatarImageMeta.naturalWidth,
      AVATAR_CROP_SIZE / avatarImageMeta.naturalHeight,
    );

    return {
      width: avatarImageMeta.naturalWidth * scale,
      height: avatarImageMeta.naturalHeight * scale,
      scale,
    };
  }

  function clampAvatarPosition(position: AvatarPosition) {
    const scaledSize = getAvatarScaledSize();
    const maxX = Math.max((scaledSize.width - AVATAR_CROP_SIZE) / 2, 0);
    const maxY = Math.max((scaledSize.height - AVATAR_CROP_SIZE) / 2, 0);

    return {
      x: Math.min(Math.max(position.x, -maxX), maxX),
      y: Math.min(Math.max(position.y, -maxY), maxY),
    };
  }

  function handleAvatarImageLoad() {
    const image = avatarImageRef.current;

    if (!image) return;

    setAvatarImageMeta({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    });
    setAvatarPosition({ x: 0, y: 0 });
  }

  function handleAvatarPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);

    setAvatarDrag({
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      initialX: avatarPosition.x,
      initialY: avatarPosition.y,
    });
  }

  function handleAvatarPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!avatarDrag.active) return;

    const nextPosition = clampAvatarPosition({
      x: avatarDrag.initialX + event.clientX - avatarDrag.startX,
      y: avatarDrag.initialY + event.clientY - avatarDrag.startY,
    });

    setAvatarPosition(nextPosition);
  }

  function handleAvatarPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setAvatarDrag((current) => ({
      ...current,
      active: false,
    }));
  }

  async function createCroppedAvatarFile() {
    const image = avatarImageRef.current;

    if (!image || !avatarImageMeta || !avatarFile) {
      throw new Error("Selecione uma imagem antes de salvar.");
    }

    const scaledSize = getAvatarScaledSize();
    const left = AVATAR_CROP_SIZE / 2 + avatarPosition.x - scaledSize.width / 2;
    const top = AVATAR_CROP_SIZE / 2 + avatarPosition.y - scaledSize.height / 2;
    const sourceX = Math.max((0 - left) / scaledSize.scale, 0);
    const sourceY = Math.max((0 - top) / scaledSize.scale, 0);
    const sourceSize = AVATAR_CROP_SIZE / scaledSize.scale;

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar o recorte da imagem.");
    }

    context.clearRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
    context.save();
    context.beginPath();
    context.arc(
      AVATAR_OUTPUT_SIZE / 2,
      AVATAR_OUTPUT_SIZE / 2,
      AVATAR_OUTPUT_SIZE / 2,
      0,
      Math.PI * 2,
    );
    context.closePath();
    context.clip();
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE,
    );
    context.restore();

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem recortada."));
          return;
        }

        resolve(
          new File([blob], "avatar.png", {
            type: "image/png",
          }),
        );
      }, "image/png");
    });
  }

  async function handleConfirmAvatarCrop() {
    setAvatarLoading(true);

    try {
      const croppedFile = await createCroppedAvatarFile();
      await userService.uploadAvatar(croppedFile);
      await refreshProfile();
      showSuccess("Foto atualizada com sucesso.");
      closeAvatarCropModal(true);
    } catch (error) {
      showError(error, "Erro ao atualizar foto");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAddressLoading(true);

    try {
      await userService.updateMyAddress({
        cep: onlyDigits(addressForm.cep),
        street: addressForm.street,
        number: addressForm.number,
        complement: normalizeNullableText(addressForm.complement),
        city: addressForm.city,
        state: addressForm.state,
      });

      await refreshProfile();

      showSuccess("Endereço atualizado com sucesso.");
    } catch (error) {
      showError(error, "Erro ao atualizar endereço");
    } finally {
      setAddressLoading(false);
    }
  }

  async function handleCepBlur() {
    const cep = onlyDigits(addressForm.cep);

    if (cep.length !== 8) {
      return;
    }

    setCepLoading(true);

    try {
      const response = await addressService.findAddressByCep(cep);

      setAddressForm((current) => ({
        ...current,
        cep: formatCep(response.cep),
        street: response.street ?? current.street,
        city: response.city ?? current.city,
        state: response.state ?? current.state,
      }));
    } catch (error) {
      showError(error, "Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  const checkoutReady = profile?.profileCompleteForCheckout;
  const avatarImageUrl =
    avatarPreview ??
    (profile?.avatarUrl ? buildPublicFileUrl(profile.avatarUrl) : null);
  const avatarInitials = getInitials(
    profile?.fullName || profile?.email || "Usuário",
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-stone-200 bg-[#EDE7D8] p-8 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">
            Minha conta
          </p>
          <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-rubik)] text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-stone-900 sm:text-5xl">
            Dados e endereço para suas compras
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700">
            O endereço principal é usado ao fechar o pedido e no cálculo do
            frete.
          </p>
          {profile && (
            <p className="mt-5 text-sm text-stone-600">
              <span className="font-semibold text-stone-800">
                {profile.email}
              </span>
              {profile.fullName ? (
                <>
                  {" "}
                  · <span className="text-stone-700">{profile.fullName}</span>
                </>
              ) : null}
              {typeof checkoutReady === "boolean" && (
                <>
                  {" "}
                  ·{" "}
                  {checkoutReady ? (
                    <span className="text-emerald-800">Checkout pronto</span>
                  ) : (
                    <span className="text-amber-900">
                      Falta endereço para checkout
                    </span>
                  )}
                </>
              )}
            </p>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 md:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Perfil
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                Dados pessoais
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Nome e contatos usados na sua conta.
              </p>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white text-xl font-semibold text-stone-700">
                  {avatarImageUrl ? (
                    <img
                      src={avatarImageUrl}
                      alt={profile?.fullName || "Foto do usuário"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarInitials
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    Foto do perfil
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Envie uma imagem JPG, PNG, WEBP ou GIF, até 5MB. Caso não
                    envie foto, suas iniciais aparecem no lugar.
                  </p>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-amber-500/45 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {avatarLoading ? "Enviando..." : "Alterar foto"}
                  </button>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    disabled={avatarLoading}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="mt-7 space-y-5">
              <label className="block">
                <span className="pc-label">Nome completo</span>
                <input
                  value={profileForm.fullName}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 pc-input"
                />
              </label>

              <label className="block">
                <span className="pc-label">CPF</span>
                <input
                  value={profileForm.cpf}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      cpf: formatCpf(event.target.value),
                    }))
                  }
                  placeholder="000.000.000-00"
                  className="mt-2 pc-input"
                />
              </label>

              <label className="block">
                <span className="pc-label">Telefone</span>
                <input
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      phone: formatPhone(event.target.value),
                    }))
                  }
                  placeholder="(19) 99999-9999"
                  className="mt-2 pc-input"
                />
              </label>

              <button
                type="submit"
                disabled={profileLoading}
                className="pc-btn pc-btn-accent mt-2 w-full disabled:opacity-60"
              >
                {profileLoading ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 md:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Entrega
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                Endereço principal
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Informe o CEP para preencher rua, cidade e estado quando
                possível.
              </p>
            </div>

            <form onSubmit={handleAddressSubmit} className="mt-7 space-y-5">
              <div className="grid gap-4 md:grid-cols-[.8fr_1fr]">
                <label className="block">
                  <span className="pc-label">CEP</span>
                  <input
                    value={addressForm.cep}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        cep: formatCep(event.target.value),
                      }))
                    }
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    required
                    className="mt-2 pc-input"
                  />
                  {cepLoading && (
                    <p className="mt-2 text-xs font-semibold text-amber-800">
                      Buscando endereço...
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="pc-label">Estado</span>
                  <input
                    value={addressForm.state}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        state: event.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    placeholder="SP"
                    required
                    className="mt-2 pc-input"
                  />
                </label>
              </div>

              <label className="block">
                <span className="pc-label">Rua</span>
                <input
                  value={addressForm.street}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      street: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 pc-input"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-[.7fr_1.3fr]">
                <label className="block">
                  <span className="pc-label">Número</span>
                  <input
                    value={addressForm.number}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        number: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 pc-input"
                  />
                </label>

                <label className="block">
                  <span className="pc-label">Complemento</span>
                  <input
                    value={addressForm.complement}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        complement: event.target.value,
                      }))
                    }
                    placeholder="Casa, apartamento, bloco..."
                    className="mt-2 pc-input"
                  />
                </label>
              </div>

              <label className="block">
                <span className="pc-label">Cidade</span>
                <input
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 pc-input"
                />
              </label>

              <button
                type="submit"
                disabled={addressLoading}
                className="pc-btn pc-btn-accent mt-2 w-full disabled:opacity-60"
              >
                {addressLoading ? "Salvando..." : "Salvar endereço"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {avatarCropOpen && avatarPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_28px_80px_rgba(46,39,31,0.18)]">
            <div className="border-b border-stone-200 px-6 py-5 md:px-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Foto do perfil
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Ajuste o recorte da imagem
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Arraste a foto para reposicionar.
              </p>
            </div>

            <div className="px-6 py-6 md:px-8">
              <div className="flex flex-col items-center gap-6">
                <div
                  className="relative h-64 w-64 cursor-grab touch-none select-none overflow-hidden rounded-full border border-stone-200 bg-[#f1efea] active:cursor-grabbing"
                  onPointerDown={handleAvatarPointerDown}
                  onPointerMove={handleAvatarPointerMove}
                  onPointerUp={handleAvatarPointerEnd}
                  onPointerCancel={handleAvatarPointerEnd}
                >
                  {(() => {
                    const scaledSize = getAvatarScaledSize();
                    const left =
                      AVATAR_CROP_SIZE / 2 +
                      avatarPosition.x -
                      scaledSize.width / 2;
                    const top =
                      AVATAR_CROP_SIZE / 2 +
                      avatarPosition.y -
                      scaledSize.height / 2;

                    return (
                      <img
                        ref={avatarImageRef}
                        src={avatarPreview}
                        alt="Prévia da foto do perfil"
                        onLoad={handleAvatarImageLoad}
                        draggable={false}
                        className="pointer-events-none absolute max-w-none select-none"
                        style={{
                          left,
                          top,
                          width: scaledSize.width,
                          height: scaledSize.height,
                        }}
                      />
                    );
                  })()}

                  <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/80" />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeAvatarCropModal()}
                  disabled={avatarLoading}
                  className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-[#d8c28f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAvatarCrop}
                  disabled={avatarLoading || !avatarImageMeta}
                  className="rounded-full bg-[#8f6f2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {avatarLoading ? "Salvando..." : "Salvar foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
