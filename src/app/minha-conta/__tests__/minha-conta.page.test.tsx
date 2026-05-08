import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyAccountPage from "../page";
import { userProfileFixture } from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useFeedbackModal: vi.fn(),
  refreshProfile: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  userService: {
    updateMyProfile: vi.fn(),
    updateMyAddress: vi.fn(),
    uploadAvatar: vi.fn(),
  },
  addressService: {
    findAddressByCep: vi.fn(),
  },
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

vi.mock("@/services/userService", () => ({
  userService: mocks.userService,
}));

vi.mock("@/services/addressService", () => ({
  addressService: mocks.addressService,
}));

describe("MyAccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      profile: userProfileFixture,
      refreshProfile: mocks.refreshProfile,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showSuccess: mocks.showSuccess,
    });

    mocks.userService.updateMyProfile.mockResolvedValue(userProfileFixture);
    mocks.userService.updateMyAddress.mockResolvedValue(userProfileFixture.address);
    mocks.addressService.findAddressByCep.mockResolvedValue({
      cep: "13480000",
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });
    mocks.refreshProfile.mockResolvedValue(userProfileFixture);
  });

  it("renderiza dados da conta do usuário", async () => {
    render(<MyAccountPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(userProfileFixture.fullName)).toBeInTheDocument();
    });

    expect(screen.getByText("Minha conta")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123.456.789-09")).toBeInTheDocument();
    expect(screen.getByDisplayValue("(19) 99999-9999")).toBeInTheDocument();
  });

  it("salva dados do perfil", async () => {
    const user = userEvent.setup();

    render(<MyAccountPage />);

    const nameInput = await screen.findByDisplayValue(userProfileFixture.fullName);

    await user.clear(nameInput);
    await user.type(nameInput, "Cliente Atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar perfil" }));

    await waitFor(() => {
      expect(mocks.userService.updateMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Cliente Atualizado",
        })
      );
    });

    expect(mocks.showSuccess).toHaveBeenCalledWith("Perfil atualizado com sucesso.");
  });

  it("salva endereço", async () => {
    const user = userEvent.setup();

    render(<MyAccountPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("13480-000")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Salvar endereço" }));

    await waitFor(() => {
      expect(mocks.userService.updateMyAddress).toHaveBeenCalled();
    });

    expect(mocks.showSuccess).toHaveBeenCalledWith("Endereço atualizado com sucesso.");
  });

  it("mostra status quando perfil ainda não está pronto para checkout", async () => {
    mocks.useAuth.mockReturnValue({
      profile: {
        ...userProfileFixture,
        profileCompleteForCheckout: false,
      },
      refreshProfile: mocks.refreshProfile,
    });

    render(<MyAccountPage />);

    expect(await screen.findByText("Falta endereço para checkout")).toBeInTheDocument();
  });

  it("busca CEP ao sair do campo e preenche cidade/estado", async () => {
    const user = userEvent.setup();

    render(<MyAccountPage />);

    const cepInput = await screen.findByDisplayValue("13480-000");

    await user.clear(cepInput);
    await user.type(cepInput, "01001000");
    fireEvent.blur(cepInput);

    await waitFor(() => {
      expect(mocks.addressService.findAddressByCep).toHaveBeenCalledWith("01001000");
    });
  });

  it("não busca CEP incompleto", async () => {
    const user = userEvent.setup();

    render(<MyAccountPage />);

    const cepInput = await screen.findByDisplayValue("13480-000");

    await user.clear(cepInput);
    await user.type(cepInput, "12345");
    fireEvent.blur(cepInput);

    expect(mocks.addressService.findAddressByCep).not.toHaveBeenCalled();
  });

  it("mostra erro quando busca de CEP falha", async () => {
    const user = userEvent.setup();

    mocks.addressService.findAddressByCep.mockRejectedValueOnce(
      new Error("CEP não encontrado")
    );

    render(<MyAccountPage />);

    const cepInput = await screen.findByDisplayValue("13480-000");

    await user.clear(cepInput);
    await user.type(cepInput, "01001000");
    fireEvent.blur(cepInput);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao buscar CEP"
      );
    });
  });

  it("mostra erro quando atualização de perfil falha", async () => {
    const user = userEvent.setup();

    mocks.userService.updateMyProfile.mockRejectedValueOnce(new Error("Falha"));

    render(<MyAccountPage />);

    await screen.findByDisplayValue(userProfileFixture.fullName);
    await user.click(screen.getByRole("button", { name: "Salvar perfil" }));

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao atualizar perfil"
      );
    });
  });

  it("mostra erro quando atualização de endereço falha", async () => {
    const user = userEvent.setup();

    mocks.userService.updateMyAddress.mockRejectedValueOnce(new Error("Falha"));

    render(<MyAccountPage />);

    await screen.findByDisplayValue("13480-000");
    await user.click(screen.getByRole("button", { name: "Salvar endereço" }));

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao atualizar endereço"
      );
    });
  });
});
