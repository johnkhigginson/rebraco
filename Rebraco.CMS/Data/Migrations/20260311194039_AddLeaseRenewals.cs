using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaseRenewals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RenewalNotifiedAt",
                schema: "rebraco",
                table: "Leases",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LeaseRenewals",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OriginalLeaseId = table.Column<int>(type: "int", nullable: false),
                    NewLeaseId = table.Column<int>(type: "int", nullable: true),
                    ProposedStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProposedEndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProposedMonthlyRent = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ProposedLeaseType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ManagerNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TenantNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OfferedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    TenantRespondedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaseRenewals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeaseRenewals_Leases_NewLeaseId",
                        column: x => x.NewLeaseId,
                        principalSchema: "rebraco",
                        principalTable: "Leases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LeaseRenewals_Leases_OriginalLeaseId",
                        column: x => x.OriginalLeaseId,
                        principalSchema: "rebraco",
                        principalTable: "Leases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaseRenewals_NewLeaseId",
                schema: "rebraco",
                table: "LeaseRenewals",
                column: "NewLeaseId",
                filter: "[NewLeaseId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseRenewals_OriginalLeaseId",
                schema: "rebraco",
                table: "LeaseRenewals",
                column: "OriginalLeaseId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseRenewals_Status",
                schema: "rebraco",
                table: "LeaseRenewals",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeaseRenewals",
                schema: "rebraco");

            migrationBuilder.DropColumn(
                name: "RenewalNotifiedAt",
                schema: "rebraco",
                table: "Leases");
        }
    }
}
