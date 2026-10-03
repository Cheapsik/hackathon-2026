using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdminPanelAndGrantCalls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "ChallengeAreaCodes",
                table: "Users",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<Guid>(
                name: "MunicipalityId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ProblemReports",
                type: "character varying(6000)",
                maxLength: 6000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(3000)",
                oldMaxLength: 3000);

            migrationBuilder.AddColumn<string>(
                name: "ReplyDraft",
                table: "ProblemReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReplyDraftUpdatedAt",
                table: "ProblemReports",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Urgency",
                table: "ProblemReports",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Value",
                table: "IndicatorValues",
                type: "numeric(19,8)",
                precision: 19,
                scale: 8,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(19,6)",
                oldPrecision: 19,
                oldScale: 6);

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "FitAssistantMessages",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.CreateTable(
                name: "GrantCalls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Criteria = table.Column<List<string>>(type: "text[]", nullable: false),
                    ChallengeAreaCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    OpensOn = table.Column<DateOnly>(type: "date", nullable: true),
                    ClosesOn = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrantCalls", x => x.Id);
                    table.CheckConstraint("CK_GrantCalls_ClosesAfterOpening", "\"OpensOn\" IS NULL OR \"ClosesOn\" IS NULL OR \"ClosesOn\" >= \"OpensOn\"");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_MunicipalityId",
                table: "Users",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_GrantCalls_Status",
                table: "GrantCalls",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Municipalities_MunicipalityId",
                table: "Users",
                column: "MunicipalityId",
                principalTable: "Municipalities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Municipalities_MunicipalityId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "GrantCalls");

            migrationBuilder.DropIndex(
                name: "IX_Users_MunicipalityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ChallengeAreaCodes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MunicipalityId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReplyDraft",
                table: "ProblemReports");

            migrationBuilder.DropColumn(
                name: "ReplyDraftUpdatedAt",
                table: "ProblemReports");

            migrationBuilder.DropColumn(
                name: "Urgency",
                table: "ProblemReports");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ProblemReports",
                type: "character varying(3000)",
                maxLength: 3000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(6000)",
                oldMaxLength: 6000);

            migrationBuilder.AlterColumn<decimal>(
                name: "Value",
                table: "IndicatorValues",
                type: "numeric(19,6)",
                precision: 19,
                scale: 6,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(19,8)",
                oldPrecision: 19,
                oldScale: 8);

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "FitAssistantMessages",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000);
        }
    }
}
