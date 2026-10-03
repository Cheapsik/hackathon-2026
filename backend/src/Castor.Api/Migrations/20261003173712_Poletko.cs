using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class Poletko : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TesterProfile_AccessibilityNeeds",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TesterProfile_Age",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TesterProfile_Equipment",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TesterProfile_MunicipalityId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SeeksTesters",
                table: "Ideas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Feedback",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    WhatWorks = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    WhatToImprove = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Dictated = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedback", x => x.Id);
                    table.CheckConstraint("CK_Feedback_HasComment", "\"WhatWorks\" IS NOT NULL OR \"WhatToImprove\" IS NOT NULL");
                    table.CheckConstraint("CK_Feedback_Stars", "\"Stars\" BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_Feedback_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Feedback_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TestSignups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetKind = table.Column<string>(type: "text", nullable: false),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: true),
                    IdeaId = table.Column<Guid>(type: "uuid", nullable: true),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestSignups", x => x.Id);
                    table.CheckConstraint("CK_TestSignups_OneTarget", "(\"TargetKind\" = 'INNOVATION' AND \"InnovationId\" IS NOT NULL AND \"IdeaId\" IS NULL) OR (\"TargetKind\" = 'IDEA' AND \"IdeaId\" IS NOT NULL AND \"InnovationId\" IS NULL)");
                    table.ForeignKey(
                        name: "FK_TestSignups_Ideas_IdeaId",
                        column: x => x.IdeaId,
                        principalTable: "Ideas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestSignups_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestSignups_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TesterProfile_MunicipalityId",
                table: "Users",
                column: "TesterProfile_MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedback_AuthorId",
                table: "Feedback",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedback_OnePerUserAndInnovation",
                table: "Feedback",
                columns: new[] { "InnovationId", "AuthorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestSignups_IdeaId",
                table: "TestSignups",
                column: "IdeaId");

            migrationBuilder.CreateIndex(
                name: "IX_TestSignups_InnovationId",
                table: "TestSignups",
                column: "InnovationId");

            migrationBuilder.CreateIndex(
                name: "IX_TestSignups_OnePerUserAndIdea",
                table: "TestSignups",
                columns: new[] { "UserId", "IdeaId" },
                unique: true,
                filter: "\"IdeaId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TestSignups_OnePerUserAndInnovation",
                table: "TestSignups",
                columns: new[] { "UserId", "InnovationId" },
                unique: true,
                filter: "\"InnovationId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Municipalities_TesterProfile_MunicipalityId",
                table: "Users",
                column: "TesterProfile_MunicipalityId",
                principalTable: "Municipalities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Municipalities_TesterProfile_MunicipalityId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Feedback");

            migrationBuilder.DropTable(
                name: "TestSignups");

            migrationBuilder.DropIndex(
                name: "IX_Users_TesterProfile_MunicipalityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TesterProfile_AccessibilityNeeds",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TesterProfile_Age",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TesterProfile_Equipment",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TesterProfile_MunicipalityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SeeksTesters",
                table: "Ideas");
        }
    }
}
