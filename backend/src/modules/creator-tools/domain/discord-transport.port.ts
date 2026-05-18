/**
 * Future Discord (or Slack) adapter hook. Implementations may post embeds,
 * follow-up messages, or no-op in tests.
 */
export interface DiscordTransportPort {
  readonly name: string;
  /** Reserved for outbound webhook / bot API calls. */
  deliverEphemeralNotice(_message: string): Promise<void>;
}
