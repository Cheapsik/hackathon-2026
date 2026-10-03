using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class Conversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    ProblemReportId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChallengeAreaCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: true),
                    InitiatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LastMessageAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                    table.CheckConstraint("CK_Conversations_KindFields", "(\"Kind\" = 'PROBLEM_REPORT' AND \"ProblemReportId\" IS NOT NULL AND \"ChallengeAreaCode\" IS NULL\n    AND \"InnovationId\" IS NULL AND \"InitiatorId\" IS NULL AND \"Subject\" IS NULL)\nOR (\"Kind\" = 'EXPERT_QUESTION' AND \"ProblemReportId\" IS NULL AND \"ChallengeAreaCode\" IS NOT NULL\n    AND \"InnovationId\" IS NULL AND \"InitiatorId\" IS NOT NULL AND \"Subject\" IS NOT NULL)\nOR (\"Kind\" = 'PARTNERSHIP' AND \"ProblemReportId\" IS NULL AND \"ChallengeAreaCode\" IS NULL\n    AND \"InnovationId\" IS NOT NULL AND \"InitiatorId\" IS NOT NULL AND \"Subject\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_Conversations_ChallengeAreas_ChallengeAreaCode",
                        column: x => x.ChallengeAreaCode,
                        principalTable: "ChallengeAreas",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_ProblemReports_ProblemReportId",
                        column: x => x.ProblemReportId,
                        principalTable: "ProblemReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_Users_InitiatorId",
                        column: x => x.InitiatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: true),
                    SenderRole = table.Column<string>(type: "text", nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    PostedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.CheckConstraint("CK_Messages_AnonymousIsInitiator", "\"AuthorId\" IS NOT NULL OR \"SenderRole\" = 'INITIATOR'");
                    table.ForeignKey(
                        name: "FK_Messages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ChallengeAreaCode",
                table: "Conversations",
                column: "ChallengeAreaCode");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_InitiatorId",
                table: "Conversations",
                column: "InitiatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_InnovationId",
                table: "Conversations",
                column: "InnovationId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_LastMessageAt",
                table: "Conversations",
                column: "LastMessageAt");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_OnePerProblemReport",
                table: "Conversations",
                column: "ProblemReportId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_AuthorId",
                table: "Messages",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId_PostedAt",
                table: "Messages",
                columns: new[] { "ConversationId", "PostedAt" });

            // Every report has its thread from now on; reports sent before threads get theirs here. The application
            // creates UUID v7 keys, the database can only make v4 ones — a key is a key, only the index order differs.
            migrationBuilder.Sql(
                """
                INSERT INTO "Conversations" ("Id", "Kind", "ProblemReportId", "CreatedAt", "UpdatedAt")
                SELECT gen_random_uuid(), 'PROBLEM_REPORT', "Id", "CreatedAt", "CreatedAt"
                FROM "ProblemReports";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Conversations");
        }
    }
}
