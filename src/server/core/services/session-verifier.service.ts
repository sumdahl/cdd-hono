export type Session = {
  userId: string;
  email: string;
  roles: string[];
  jti: string;
  exp: number;
};

export interface ISessionVerifier {
  verify(accessToken: string): Promise<Session>;
}
